package com.crseneagalmobile;

public class AvailableConnectionCustom {
    private String availableConnection;

    public AvailableConnectionCustom() {
    }

    public String getAvailableConnection() {
        return availableConnection;
    }

    public void setAvailableConnection(String availableConnection) {
        this.availableConnection = availableConnection;
    }

    @Override
    public String toString() {
        return "AvailableConnectionCustom{" +
                "availableConnection='" + availableConnection + '\'' +
                '}';
    }
}
