package com.crseneagalmobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.documentfile.provider.DocumentFile;

import com.blackbox.plog.pLogs.PLog;
import com.blackbox.plog.pLogs.models.LogLevel;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.time.OffsetDateTime;
import java.util.Objects;

import com.crseneagalmobile.BuildConfig;

public class FileManager {

    private Activity activity;

    public FileManager(Activity activity) {
        this.activity = activity;
    }

    public void openDirectory(Uri pickerInitialUri, int requestCode) {

        // Choose a directory using the system's file picker.
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        int flag = Intent.FLAG_GRANT_READ_URI_PERMISSION;
        intent.setFlags(flag);
        intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, pickerInitialUri);
        activity.startActivityForResult(intent, requestCode);
    }

    public void copy(File inputFile, File outputFile) {
        try {
            InputStream in = new BufferedInputStream(new FileInputStream(inputFile));
            //OutputStream out = activity.getContentResolver().openOutputStream(outputFile.getUri());
            OutputStream out = new BufferedOutputStream(new FileOutputStream(outputFile));


            byte[] buffer = new byte[1024];
            int lengthRead;
            while ((lengthRead = in.read(buffer)) > 0) {
                out.write(buffer, 0, lengthRead);
                out.flush();
            }
        } catch (IOException e) {
            PLog.INSTANCE.logThis("Error", "Error", OffsetDateTime.now().toString(), e, LogLevel.ERROR);
        }
    }

    public String extractJson(Uri uri) throws Exception {

        StringBuilder stringBuilder = new StringBuilder();
        InputStream inputStream = activity.getContentResolver().openInputStream(DocumentFile.fromTreeUri(activity, uri).findFile(BuildConfig.configFilename).getUri());
        BufferedReader reader = new BufferedReader(new InputStreamReader(Objects.requireNonNull(inputStream)));
        String line;
        while ((line = reader.readLine()) != null) {
            stringBuilder.append(line);
        }

        return stringBuilder.toString();

    }
}

