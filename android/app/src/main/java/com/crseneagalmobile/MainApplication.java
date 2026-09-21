package com.crseneagalmobile;

import android.Manifest;
import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;

import androidx.core.content.ContextCompat;

import com.bebound.sdk.BeBound;
import com.bebound.sdk.SdkConfig;
import com.blackbox.plog.pLogs.PLog;
import com.blackbox.plog.pLogs.config.LogsConfig;
import com.dgtd.be_bound.C;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private static SharedPreferences preferences;
  private static Application sApplication;

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here.
          packages.add(new MyAppPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public ReactHost getReactHost() {
    return DefaultReactHost.getDefaultReactHost(getApplicationContext(), mReactNativeHost);
  }

  @Override
  public void onCreate() {
    super.onCreate();
    sApplication = this;
    setUpPLogger();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }

    // Be-Bound (SMS/data transport) is only initialised when the flavor enables it.
    // The vendored AARs stay: sweet_alert provides the loader/alert dialogs and
    // SdkJs.getRealmConfig() the Realm key, independently of this flag.
    if (BuildConfig.useBebound) {
      SdkConfig sdkConfig = new SdkSampleConfig();
      preferences = getSharedPreferences("preferences", Context.MODE_PRIVATE);
      preferences.edit().putString(C.APP_UUID, sdkConfig.appUuid()).apply();
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE)
          == PackageManager.PERMISSION_GRANTED) {
        BeBound.init(this, sdkConfig, BeBound.LogConfig.ALL, BuildConfig.pingUrl);
      }
    }
  }

  private void setUpPLogger() {
    String logsPath = getExternalFilesDir(null).getPath() + File.separator + "ErrorLogs";
    LogsConfig logsConfig = new LogsConfig();
    logsConfig.setDebuggable(true);
    logsConfig.setSavePath(logsPath);
    logsConfig.setZipFileName("zipLogs");
    PLog.INSTANCE.applyConfigurations(logsConfig, this);
  }
}
