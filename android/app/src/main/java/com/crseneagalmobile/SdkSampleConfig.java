package com.crseneagalmobile;



import com.bebound.sdk.SdkConfig;



public class SdkSampleConfig implements SdkConfig {
    @Override
    public String appUuid() {
        return BuildConfig.uuidBebound;
    }

    @Override
    public int appVersion() {
        return 1;
    }

    @Override
    public boolean amqpEnabled() {
        return false;
    }

    @Override
    public boolean httpsEnabled() {
        return true;
    }

    @Override
    public boolean smsBinaryEnabled() {
        return false;
    }

    @Override
    public boolean smsTextEnabled() {
        return true;
    }
}
