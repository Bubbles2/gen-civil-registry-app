package com.crseneagalmobile;


import static androidx.core.app.ActivityCompat.startActivityForResult;
import static androidx.core.content.ContextCompat.startActivity;
import static com.bebound.sdk.Request.QoS.AT_MOST_ONCE;
import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;

import android.app.Activity;
import android.content.ContentProviderClient;
import android.content.ContentResolver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.ParcelFileDescriptor;
import android.os.storage.StorageManager;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.documentfile.provider.DocumentFile;


import com.bebound.sdk.BeBound;
import com.bebound.sdk.Message;
import com.bebound.sdk.Request;
import com.bebound.sdk.SingletonDataBebound;
import com.blackbox.plog.pLogs.PLog;
import com.blackbox.plog.pLogs.models.LogLevel;

import com.dgtd.be_bound.C;
import com.dgtd.be_bound.CustomProvider;
import com.dgtd.be_bound.generated.AvailableConnections;
import com.dgtd.be_bound.generated.DeclarationAct;
import com.dgtd.be_bound.generated.SaveTestData;
import com.dgtd.be_bound.generated.TestDataResponse;
import com.dgtd.be_bound.generated.UpdateDataResponse;
import com.dgtd.be_bound.generated.UpdateTestData;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.google.gson.Gson;

import org.checkerframework.framework.qual.FromByteCode;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Objects;

import cn.pedant.SweetAlert.SweetAlertDialog;


import com.crseneagalmobile.BuildConfig;


public class SdkJs extends ReactContextBaseJavaModule
        implements BeBound.SubscriptionListener, BeBound.Listener, SweetAlertDialog.OnSweetClickListener, ActivityEventListener {

    private Context context;
    private CountDownTimer countDownTimer;
    private SweetAlertDialog dialog;
    private ReactContext reactContext;
    private String jsonConfig;
    private boolean devMode;

    // constructor
    public SdkJs(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.context = reactContext.getApplicationContext();
        reactContext.addActivityEventListener(this);
    }

    // Mandatory function getName that specifies the module name
    @Override
    public String getName() {
        return "SdkJs";
    }

    public long getSharePrefLong(String key) {
        return context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getLong(key, -1);
    }

    public String getSharePrefString(String key) {
        return context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString(key, null);
    }

    public Boolean getSharePrefBool(String key) {
        return context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getBoolean(key, false);
    }

    public Integer getSharePrefInt(String key, int defaultValue) {
        return context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getInt(key, defaultValue);
    }

    public void provider(String country, String name, String phoneNumber, String prefix, boolean binary, String cName,
            boolean httpSubscribe) {
        if (country != null && name != null && phoneNumber != null && cName != null) {
            CustomProvider customProvider = new CustomProvider(context);
            customProvider.fixeProvider(country, name, phoneNumber, prefix, binary, cName);

            if (BeBound.isSubscribed()) {
                onSubscriptionSuccess((short) 0x00);
            } else {
                BeboundActiveMode.getInstance().setMode(BeboundActiveMode.BeBoundEnumMode.SUBSCRIPTION);
                if (getSharePrefString("nbTrySubscribeBebound") != null) {
                    if (!(getSharePrefString("nbTrySubscribeBebound").equals(getSharePrefString("maxTrySubcriptionBebound")))) {
                        if (httpSubscribe) {
                            BeBound.Subscription.getInstance().listener(this).subscribeWebOnly();
                        } else {
                            BeBound.Subscription.getInstance().listener(this).subscribe();
                        }

                    } else {
                        pushAlert("Attention",
                                "Nombre de tentative de souscription à bebound atteint.Veuillez contacter votre administrateur.",
                                SweetAlertDialog.WARNING_TYPE, false, false, "Ok", null);
                    }

                } else {
                    if (httpSubscribe) {
                        BeBound.Subscription.getInstance().listener(this).subscribeWebOnly();
                    } else {
                        BeBound.Subscription.getInstance().listener(this).subscribe();
                    }
                }
            }
        }
    }


    private void sendBeboundResponseToJs(UpdateTestData update) {

        // Create map for params
        WritableMap payload = Arguments.createMap();
        // Put data to map
        payload.putString("identifier", update.data.identifier);
        payload.putInt("beboundPayloadSize", update.data.beboundPayloadSize);
        payload.putString("mobileAckResponseDateTime", String.valueOf(update.data.mobileAckResponseDateTime));
        payload.putString("connectivity", update.data.connectivity);
        if (update.data.nbSMS != null) {
            payload.putInt("nbSMS", update.data.nbSMS);
        } else {
            payload.putInt("nbSMS", 0);
        }

        payload.putInt("jsonPayloadSize", update.data.jsonPayloadSize);

        // Get EventEmitter from context and send event thanks to it
        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit("onBeboundResponse", payload);

    }

    private void sendBeboundResponseToJsError(String error) {
        // Create map for params
        WritableMap payload = Arguments.createMap();
        // Get EventEmitter from context and send event thanks to it
        payload.putString("error", error);

        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit("onBeboundResponseError", payload);
    }

    @Override
    public void onSuccess(Message message) {

    }

    @Override
    public void onResponse(Message message, SingletonDataBebound data) {
        cancelTimer();
        if (message instanceof TestDataResponse) {
            TestDataResponse response = (TestDataResponse) message;
            // continue
            UpdateTestData update = new UpdateTestData();
            update.withIdentifier(response.data.identifier);
            update.withBeboundPayloadSize(data.getBeboundPayloadSize());
            update.withJsonPayloadSize(data.getJsonPayloadSize());
            update.withMobileAckResponseDateTime(data.getMobileAckResponseDateTime().toInstant().toEpochMilli());
            if (data.getNbSms() != null && data.getNbSms() > 0) {
                update.withNbSMS(data.getNbSms());
                update.withConnectivity(DeclarationAct.Enumerations.CONNECTIVITY.S_M_S);
            } else {
                update.withConnectivity(DeclarationAct.Enumerations.CONNECTIVITY.H_T_T_P);
            }

            sendBeboundResponseToJs(update);
            SingletonDataBebound.getInstance().setNbSms(null);
        }
        if (message instanceof UpdateDataResponse) {
            UpdateDataResponse response = (UpdateDataResponse) message;
            // Ok, mise a jour en status envoye_update
            sendEventUpdateStatus("ENVOYE_UPDATE");
        }
    }

    @ReactMethod
    public void getServiceConfig(Promise promise) {
        WritableMap payload = Arguments.createMap();
        try{
            payload.putString("delay",getSharePrefString("delay") );
            payload.putBoolean("auto-send", getSharePrefBool("autoSend"));
            payload.putString("network", getSharePrefString("network"));
            // Get EventEmitter from context and send event thanks to it
            promise.resolve(payload);
        }catch (Exception ex){
            promise.reject(ex.getCause());
        }

    }

    @ReactMethod
    public void getHttpConfig(Promise promise) {
        WritableMap payload = Arguments.createMap();
        try{
            payload.putString("schema",getSharePrefString("schema") );
            payload.putString("domain",getSharePrefString("domain") );
            payload.putString("port",getSharePrefString("port") );
            payload.putString("path",getSharePrefString("path") );

            // Get EventEmitter from context and send event thanks to it
            promise.resolve(payload);
        }catch (Exception ex){
            promise.reject(ex.getCause());
        }

    }

    @ReactMethod
    public void getRealmConfig(Promise promise) {
        promise.resolve(BuildConfig.realmCode);
    }
    @ReactMethod
    public void sendFalseBeboundRequestForTestSuccess(ReadableMap readableMap) {
        if (!BuildConfig.useBebound) {
            Log.w("SdkJs", "sendFalseBeboundRequestForTestSuccess ignored: useBebound is false for this flavor");
            return;
        }

        Log.d("test",readableMap.toString());
        String obj1 = readableMap.getString("ID");
        String obj2 = readableMap.getString("networkd");

        WritableMap payload = Arguments.createMap();
        payload.putString("receive", "ok");
        payload.putString("id", obj1);


        /*Request.RequestBuilder req = BeBound
        .message(update)
        .listener(this)
        .response(UpdateDataResponse.class)
        .qos(AT_MOST_ONCE);
        switch(obj2){
            case "DATA-SMS":req.transport(BeBound.Transport.BEST);break;
            case "DATA-ONLY":req.transport(BeBound.Transport.HTTP);break;
            case "SMS-ONLY":req.transport(BeBound.Transport.SMS);break;
        }
        req.send();*/



            new Thread(() -> {
                try {
                    Thread.sleep(5000);
                    ((Runnable) () -> {
                        // Get EventEmitter from context and send event thanks to it
                        reactContext
                                .getJSModule(RCTNativeAppEventEmitter.class)
                                .emit("onBeboundResponse", payload);
                    }).run();
                }
                catch (Exception e){
                    System.err.println(e);
                }
            }).start();



    }

    @ReactMethod
    public void sendFalseBeboundRequestForTestError(ReadableMap readableMap) {
        if (!BuildConfig.useBebound) {
            Log.w("SdkJs", "sendFalseBeboundRequestForTestError ignored: useBebound is false for this flavor");
            return;
        }


        Log.d("test",readableMap.toString());
        String obj1 = readableMap.getString("ID");
        //String obj2 = readableMap.getString("obj2");

        WritableMap payload = Arguments.createMap();
        payload.putString("receive", "error bebound");
        payload.putString("id", obj1);


            new Thread(() -> {
                try {
                    Thread.sleep(5000);
                    ((Runnable) () -> {
                        // Get EventEmitter from context and send event thanks to it
                        reactContext
                                .getJSModule(RCTNativeAppEventEmitter.class)
                                .emit("onBeboundResponseError", payload);
                    }).run();
                }
                catch (Exception e){
                    System.err.println(e);
                }
            }).start();



    }

    private void sendEventUpdateStatus(String status) {
        WritableMap payload = Arguments.createMap();
        payload.putString("status", status);

        // Get EventEmitter from context and send event thanks to it
        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit("updateStatus", payload);
    }

    @ReactMethod
    public void sendUpdateData(String identifier, String beboundPayloadSize, String jsonPayloadSize,
            String mobileAckResponseDateTime, String nbSms) {
        if (!BuildConfig.useBebound) {
            Log.w("SdkJs", "sendUpdateData ignored: useBebound is false for this flavor");
            return;
        }

                runOnUiThread(() -> {
                    if(dialog != null && !dialog.isShowing()) {
                        dialog = pushLoader("Export en cours");
                    }
                    runTimeoutCountDown(BuildConfig.timeoutBebound);
                });

        UpdateTestData update = new UpdateTestData();
        update.withIdentifier(identifier);
        update.withBeboundPayloadSize(Integer.valueOf(beboundPayloadSize));
        update.withJsonPayloadSize(Integer.valueOf(jsonPayloadSize));
        update.withMobileAckResponseDateTime(Long.parseLong(mobileAckResponseDateTime));
        if (nbSms != null && Integer.parseInt(nbSms) > 0) {
            update.withNbSMS(Integer.parseInt(nbSms));
            update.withConnectivity(DeclarationAct.Enumerations.CONNECTIVITY.S_M_S);
        } else {
            update.withConnectivity(DeclarationAct.Enumerations.CONNECTIVITY.H_T_T_P);
        }
        Request.RequestBuilder req = BeBound
                .message(update)
                .listener(this)
                .response(UpdateDataResponse.class)
                .qos(AT_MOST_ONCE);
        req.transport(BeBound.Transport.BEST);
        req.send();
    }

    @Override
    public void onResponseError(String s, SingletonDataBebound data) {
        PLog.INSTANCE.logThis("Error", OffsetDateTime.now().toString(), s, LogLevel.ERROR);
        cancelTimer();
        Log.d("test", "onResponseError: " + s);
        sendBeboundResponseToJsError(s);
    }

    @Override
    public void onError(int i, String s) {
        // error bebound
        Log.d("test", "erreur : " + i + "/" + s);
        cancelTimer();
        sendBeboundResponseToJsError(s);
    }

    @Override
    public void onSubscriptionSent() {
        int nbTrySubscribeBebound = getSharePrefString("nbTrySubscribeBebound") == null ? 1
                : Integer.parseInt(getSharePrefString("nbTrySubscribeBebound"));
        runOnUiThread(() -> Toast.makeText(context, "Souscription bebound n°" + nbTrySubscribeBebound + " en cours ...",
                Toast.LENGTH_SHORT).show());
    }

    @Override
    public void onSubscriptionSuccess(short i) {
        SharedPreferences preferences = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
        preferences.edit().putBoolean(C.AUTH, true).apply();
        runOnUiThread(() -> Toast.makeText(context, "Souscription bebound réussi", Toast.LENGTH_LONG).show());

    }

    @Override
    public void onSubscriptionError(int i, String s) {
        runOnUiThread(() -> pushAlert("Souscription", "error : " + i + "/" + s, SweetAlertDialog.ERROR_TYPE, false,
                false, "Ok", null));
        PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString() + " ," + s, LogLevel.ERROR);
    }

    @Override
    public void onSubscriptionTimeout() {
        Toast.makeText(context, "Délais de souscription bebound dépassé", Toast.LENGTH_SHORT).show();

        int nbTrySubscribeBebound;
        if (getSharePrefString("nbTrySubscribeBebound") == null) {
            nbTrySubscribeBebound = 1;
        } else {
            nbTrySubscribeBebound = Integer.parseInt(getSharePrefString("nbTrySubscribeBebound"));
        }

        if (String.valueOf(nbTrySubscribeBebound).equals(getSharePrefString("maxTrySubcriptionBebound"))) {
            Toast.makeText(context, "Nombres d'éssais de souscription bebound atteintes", Toast.LENGTH_LONG).show();
        } else {
            int newNbTry = nbTrySubscribeBebound + 1;
            saveSharePrefString("nbTrySubscribeBebound", String.valueOf(newNbTry));
            //provider(getSharePrefString("agregateurCountry"), getSharePrefString("agregateurName"), getSharePrefString("agregateurNumber"), getSharePrefString("agregateurPrefix"),
                   // getSharePrefBool("agregateurBinary"), getSharePrefString("agregateurCname"), getSharePrefBool("souscriptionHTTP"));
        }
    }

    private void runTimeoutCountDown(int msTimeout) {
        countDownTimer = new CountDownTimer(msTimeout, 1000) {

            public void onTick(long millisUntilFinished) {
            }

            public void onFinish() {
                runOnUiThread(() -> {
                    sendBeboundResponseToJsError("Timeout");
                });
            }
        }.start();
    }

    void cancelTimer() {
        if (countDownTimer != null)
            countDownTimer.cancel();
    }

    private void importErreur(String erreurs, String titre, SweetAlertDialog dialog) {

        // Formatage de la liste
        dialog.changeAlertType(SweetAlertDialog.ERROR_TYPE);
        dialog.setConfirmText("Ok");
        dialog.setTitleText(titre);
        dialog.setContentText(erreurs);
        dialog.clearAnimation();
    }

    public SweetAlertDialog pushAlert(String title, String message, int typeAlert, boolean confirmListener,
            boolean cancelListener, String confirmText, String cancelText) {

        SweetAlertDialog dialog = new SweetAlertDialog(getCurrentActivity(), typeAlert);
        dialog.setTitleText(title);
        dialog.setContentText(message);
        dialog.setCancelText(cancelText);
        dialog.setConfirmText(confirmText);
        if (confirmListener) {
            dialog.setConfirmClickListener(this);
        }
        if (cancelListener) {
            dialog.setCancelClickListener(this);
        }
        dialog.show();

        return dialog;

    }

    @ReactMethod
    public SweetAlertDialog pushAlertError(String title, String message, String confirmText) {

        SweetAlertDialog dialog = new SweetAlertDialog(getCurrentActivity(), SweetAlertDialog.ERROR_TYPE);
        dialog.setTitleText(title);
        dialog.setContentText(message);
        dialog.setCancelText(null);
        dialog.setConfirmText(confirmText);
        dialog.show();

        return dialog;

    }

    public void saveSharePrefBool(String key, boolean value) {
        SharedPreferences sharedPref = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();

        editor.putBoolean(key, value).apply();
    }

    public void saveSharePrefString(String key, String value) {
        SharedPreferences sharedPref = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();

        editor.putString(key, value).apply();
    }

    public void saveSharePrefInt(String key, int value) {
        SharedPreferences sharedPref = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();

        editor.putInt(key, value).apply();
    }

    public void saveSharePrefLong(String key, long value) {
        SharedPreferences sharedPref = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();

        editor.putLong(key, value).apply();
    }

    @ReactMethod
    public void init(String json,boolean devMode) {
        if(devMode){
            jsonConfig = json;
            this.devMode = devMode;
        }
        askDocumentDirectoryPermission();
        //provider(getSharePrefString("agregateurCountry"), getSharePrefString("agregateurName"), getSharePrefString("agregateurNumber"), getSharePrefString("agregateurPrefix"),
           //     getSharePrefBool("agregateurBinary"), getSharePrefString("agregateurCname"), getSharePrefBool("souscriptionHTTP"));
    }


    @ReactMethod
    public void transformJsObject(String obj, boolean isSms) {
        if (!BuildConfig.useBebound) {
            Log.w("SdkJs", "transformJsObject ignored: useBebound is false for this flavor");
            return;
        }

        runOnUiThread(() -> {
            dialog = pushLoader("Export en cours");
            runTimeoutCountDown(BuildConfig.timeoutBebound);
        });

        Gson g = new Gson();
        SaveDataTestCustom s = g.fromJson(obj, SaveDataTestCustom.class);

        SaveTestData data = new SaveTestData();
        data.withMacMobile(s.getMacMobile());
        data.withIdMobile(s.getIdMobile());
        data.withGpsLocation(s.getGpsLocation_lon().toString() + ", " + s.getGpsLocation_lat().toString());
        data.withForceSMS(s.getForceSMS());
        data.withAttempts(s.getAttempts());
        data.withDescription(s.getDescription());
        data.withPlaceType(s.getPlaceType());
        data.withLocation(s.getLocation());

        AvailableConnections[] availableConnections = new AvailableConnections[s.getAvailableConnections().size()];
        for (int i = 0; i < s.getAvailableConnections().size(); i++) {
            AvailableConnections temp = new AvailableConnections();
            temp.data.availableConnection = s.getAvailableConnections().get(i).getAvailableConnection();
            availableConnections[i] = temp;
        }

        data.withAvailableConnections(availableConnections);
        data.withOtherPlaceType(s.getOtherPlaceType());
        data.withSavedDateTime(s.getSavedDateTime());
        data.withSentDateTime(s.getSentDateTime());

        Request.RequestBuilder req = BeBound
                .message(data)
                .listener(this)
                .response(TestDataResponse.class)
                .qos(AT_MOST_ONCE);

        if (isSms) {
            req.transport(BeBound.Transport.SMS_TEXT);
        } else {
            req.transport(BeBound.Transport.BEST);
        }
        req.send();

    }

    public SweetAlertDialog pushLoader(String title) {

        SweetAlertDialog dialog = new SweetAlertDialog(getCurrentActivity(), SweetAlertDialog.PROGRESS_TYPE);
        dialog.getProgressHelper().setBarColor(Color.parseColor("#A5DC86"));
        dialog.setTitleText(title);
        dialog.setCancelable(false);
        dialog.show();

        return dialog;

    }

    @Override
    public void onClick(SweetAlertDialog sweetAlertDialog, boolean b, boolean b1) {

    }


    @ReactMethod
    public void changeAlert(String type, String text) {

        runOnUiThread(() -> {
            if (type.equals("success")) {
                dialog.changeAlertType(SweetAlertDialog.SUCCESS_TYPE);
                dialog.setConfirmText("Ok");
                dialog.setContentText(text);
                dialog.clearAnimation();
            }else if (type.equals("error")) {
                dialog.changeAlertType(SweetAlertDialog.ERROR_TYPE);
                dialog.setConfirmText("Ok");
                dialog.setContentText(text);
                dialog.clearAnimation();
            }
        });

    }

    @ReactMethod
    public void dismissLoader() {

        runOnUiThread(() -> {
            if(dialog != null){
                dialog.dismissWithAnimation();
            } 
        });

    }

    private void askDocumentDirectoryPermission() {
        FileManager fileManager = new FileManager(getCurrentActivity());
        String auth = context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString("configAuth", null);
        if(auth == null){
            SweetAlertDialog dialog = pushAlert("Permission répertoire document", "Autoriser l'accès au répertoire document", SweetAlertDialog.NORMAL_TYPE,
            false, false, "Ok", null);
            dialog.setConfirmClickListener((sweetAlertDialog, confirmClick, cancelClick) -> {
            fileManager.openDirectory(Uri.parse(BuildConfig.configPath), 3);
            dialog.dismissWithAnimation();
    });
        }else{
            if(devMode){
                boolean success = writeConfigFile(jsonConfig, BuildConfig.configFilename);
                if(success) {
                    importConfigFile();
                }else{
                    Toast.makeText(context, "Erreur lors de la copie du fichier de configuration", Toast.LENGTH_SHORT).show();
                }
            }else{
                importConfigFile();
            }
                
                //provider(getSharePrefString("agregateurCountry"), getSharePrefString("agregateurName"), getSharePrefString("agregateurNumber"), getSharePrefString("agregateurPrefix"),
                //getSharePrefBool("agregateurBinary"), getSharePrefString("agregateurCname"), getSharePrefBool("souscriptionHTTP"));

        }
    }
    private void importConfigFile() {

        FileManager fileManager = new FileManager(getCurrentActivity());
        String auth = context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString("configAuth", null);

        if (auth != null) {

            Uri uri = Uri.parse(auth);
            String config;
            try {
                config = fileManager.extractJson(uri);
                JSONObject jsonObject;

                jsonObject = new JSONObject(config);
                JSONObject notification = jsonObject.optJSONObject("notification");
                boolean autoSend = notification.optBoolean("auto-send");
                int delay = notification.optInt("delay");
                String network = notification.optString("network");

                JSONObject http = jsonObject.optJSONObject("ws").optJSONObject("http");
                String schema = http.optString("schema");
                String port = http.optString("port");
                String domain = http.optString("domain");
                String path = http.optString("path");

                saveSharePrefBool("autoSend", autoSend);
                saveSharePrefString("network", network);
                saveSharePrefString("delay", String.valueOf(delay));

                saveSharePrefString("schema", schema);
                saveSharePrefString("domain", domain);
                saveSharePrefString("port", port);
                saveSharePrefString("path", path);

            } catch (Exception e) {
                PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString(), e, LogLevel.ERROR);
                pushAlert("Erreur", "Erreur lors de l'import du fichier de config", SweetAlertDialog.ERROR_TYPE, false, false, "Ok", null);
            }
        } else {
            SweetAlertDialog dialog = pushAlert("Permission répertoire document", "Autoriser l'accès au répertoire document", SweetAlertDialog.NORMAL_TYPE,
                    false, false, "Ok", null);
            dialog.setConfirmClickListener((sweetAlertDialog, confirmClick, cancelClick) -> {
                fileManager.openDirectory(Uri.parse(BuildConfig.configPath), 3);
                dialog.dismissWithAnimation();
            });

        }


    }


    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == 3 && resultCode == Activity.RESULT_OK) {

            Uri access = data.getData();

            SharedPreferences sharedPref = context.getSharedPreferences("preferences", Context.MODE_PRIVATE);
            sharedPref.edit().putString("configAuth", access.toString()).apply();
            // Perform operations on the document using its URI.
            ContentResolver contentResolver = context.getContentResolver();

            int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            // Check for the freshest data.
            contentResolver.takePersistableUriPermission(data.getData(), takeFlags);

            String auth = context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString("configAuth", null);
            if (auth != null) {
                Toast.makeText(context, "Autorisation reçue", Toast.LENGTH_SHORT).show();
                if(devMode){
                    boolean success = writeConfigFile(jsonConfig, BuildConfig.configFilename);
                    if(success) {
                        importConfigFile();
                    }else{
                        Toast.makeText(context, "Erreur lors de la copie du fichier de configuration", Toast.LENGTH_SHORT).show();
                    }
                }else{
                    importConfigFile();
                }
                
                //provider(getSharePrefString("agregateurCountry"), getSharePrefString("agregateurName"), getSharePrefString("agregateurNumber"), getSharePrefString("agregateurPrefix"),
                        //getSharePrefBool("agregateurBinary"), getSharePrefString("agregateurCname"), getSharePrefBool("souscriptionHTTP"));
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @ReactMethod
    public void alertPermission(){
        SweetAlertDialog dialog = pushAlert("Permissions", "Des permissions obligatoires sont manquantes", SweetAlertDialog.WARNING_TYPE,
        false, false, "Ok", null);
        dialog.setConfirmClickListener((sweetAlertDialog, confirmClick, cancelClick) -> {
            Intent myIntent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package",context.getPackageName(),null);
            myIntent.setData(uri);
            startActivityForResult(getCurrentActivity(),myIntent,0,null);
         dialog.dismissWithAnimation();
        });
    }

    @ReactMethod
    public void writeLog(String text,String filename){
          try {
              String auth = context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString("configAuth", null);
              if (auth != null) {
                  Uri uri = Uri.parse(auth);
                  DocumentFile df = DocumentFile.fromTreeUri(getCurrentActivity(), uri).findFile(filename);
                  if(df == null){
                      df = Objects.requireNonNull(DocumentFile.fromTreeUri(getCurrentActivity(), uri)).createFile("text/plain",filename);
                  }

                  ContentProviderClient providerClient = getCurrentActivity().getContentResolver().acquireContentProviderClient(uri);
                  ParcelFileDescriptor descriptor = providerClient.openFile(df.getUri(), "wa");
                  FileOutputStream f = new FileOutputStream(descriptor.getFileDescriptor());
                  f.write(text.getBytes(StandardCharsets.UTF_8));
                  f.write("\n".getBytes());
                  f.close();
              }
          } catch (Exception e) {
              PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString(), e, LogLevel.ERROR);
          }
    }

    public boolean writeConfigFile(String text,String filename){
          try {
              String auth = context.getSharedPreferences("preferences", Context.MODE_PRIVATE).getString("configAuth", null);
              if (auth != null) {
                  Uri uri = Uri.parse(auth);
                  DocumentFile df = DocumentFile.fromTreeUri(getCurrentActivity(), uri).findFile(filename);
                  if(df == null){
                      df = Objects.requireNonNull(DocumentFile.fromTreeUri(getCurrentActivity(), uri)).createFile("application/json",filename);
                  }

                  ContentProviderClient providerClient = getCurrentActivity().getContentResolver().acquireContentProviderClient(uri);
                  ParcelFileDescriptor descriptor = providerClient.openFile(df.getUri(), "wa");
                  FileOutputStream f = new FileOutputStream(descriptor.getFileDescriptor());
                  f.write(text.getBytes(StandardCharsets.UTF_8));
                  f.flush();
                  f.close();

                  return true;
              }
              return false;
          } catch (Exception e) {
              PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString(), e, LogLevel.ERROR);
          }
          return false;
    }
    @ReactMethod
    public void JsLoader(String title){
        runOnUiThread(() -> {
            dialog = pushLoader(title);
        });
    }

    // Names the two SQLite stores open with. react-native-sqlite-storage uses
    // location "default" and op-sqlite its default location; both resolve to
    // context.getDatabasePath(name). crsen.db holds the declarations migrated
    // out of Realm in Phase 12, so the export corpus is incomplete without it.
    private static final String[] SQLITE_DB_NAMES = {"dbSenegal.db", "crsen.db"};

    /**
     * Creates <externalFilesDir>/export/<timestamp>/, copies the SQLite
     * database (plus any -journal/-wal/-shm sidecar) and a manifest.txt into
     * it, and resolves with the directory path. The JS side then writes the
     * Realm copy into the same directory via realm.writeCopyTo(), which is the
     * only safe way to copy an open Realm.
     *
     * getExternalFilesDir(null) is app-specific storage: no permission is
     * needed to write it, and `adb pull` can read it from a release build
     * (allowBackup=false blocks adb backup and run-as needs a debuggable APK).
     * The files are removed with the app on uninstall.
     */
    @ReactMethod
    public void exportDatabases(Promise promise) {
        try {
            File base = context.getExternalFilesDir(null);
            if (base == null) {
                promise.reject("NO_EXTERNAL_STORAGE", "getExternalFilesDir(null) returned null");
                return;
            }
            String stamp = OffsetDateTime.now().toString().replace(":", "-");
            File dir = new File(new File(base, "export"), stamp);
            if (!dir.mkdirs() && !dir.isDirectory()) {
                promise.reject("MKDIR_FAILED", "cannot create " + dir.getAbsolutePath());
                return;
            }

            StringBuilder manifest = new StringBuilder();
            manifest.append("package=").append(context.getPackageName()).append('\n');
            manifest.append("flavor=").append(BuildConfig.FLAVOR).append('\n');
            manifest.append("versionName=").append(BuildConfig.VERSION_NAME).append('\n');
            manifest.append("versionCode=").append(BuildConfig.VERSION_CODE).append('\n');
            manifest.append("gitSha=").append(BuildConfig.GIT_SHA).append('\n');
            manifest.append("exportedAt=").append(OffsetDateTime.now().toString()).append('\n');

            for (String dbName : SQLITE_DB_NAMES) {
                File sqlite = context.getDatabasePath(dbName);
                for (String suffix : new String[]{"", "-journal", "-wal", "-shm"}) {
                    File src = new File(sqlite.getPath() + suffix);
                    if (src.isFile()) {
                        File dst = new File(dir, src.getName());
                        Files.copy(src.toPath(), dst.toPath(), StandardCopyOption.REPLACE_EXISTING);
                        // Files.copy creates the file owner-only (0600); `adb shell` runs as
                        // a different user and could not pull it. Match the other files.
                        dst.setReadable(true, false);
                        manifest.append("sqlite=").append(dst.getName()).append(" bytes=").append(dst.length()).append('\n');
                    }
                }
            }

            File manifestFile = new File(dir, "manifest.txt");
            try (FileOutputStream f = new FileOutputStream(manifestFile)) {
                f.write(manifest.toString().getBytes(StandardCharsets.UTF_8));
            }

            promise.resolve(dir.getAbsolutePath());
        } catch (Exception e) {
            PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString(), e, LogLevel.ERROR);
            promise.reject("EXPORT_FAILED", e);
        }
    }

}
