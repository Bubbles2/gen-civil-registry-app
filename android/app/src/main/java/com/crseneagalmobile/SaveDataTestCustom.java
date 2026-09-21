package com.crseneagalmobile;


import java.util.Arrays;
import java.util.List;

public class SaveDataTestCustom {
    public String macMobile;
    public String idMobile;
    public String location;
    public Long savedDateTime;
    public Long sentDateTime;
    public String description;
    public Integer attempts;
    public String connectivity;
    public String placeType;
    public String otherPlaceType;
    public List<AvailableConnectionCustom> availableConnections;
    public Boolean forceSMS;
    public Double gpsLocation_lat;
    public Double gpsLocation_lon;

    public SaveDataTestCustom() {
    }

    public String getMacMobile() {
        return macMobile;
    }

    public void setMacMobile(String macMobile) {
        this.macMobile = macMobile;
    }

    public String getIdMobile() {
        return idMobile;
    }

    public void setIdMobile(String idMobile) {
        this.idMobile = idMobile;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getSavedDateTime() {
        return savedDateTime;
    }

    public void setSavedDateTime(Long savedDateTime) {
        this.savedDateTime = savedDateTime;
    }

    public Long getSentDateTime() {
        return sentDateTime;
    }

    public void setSentDateTime(Long sentDateTime) {
        this.sentDateTime = sentDateTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public String getConnectivity() {
        return connectivity;
    }

    public void setConnectivity(String connectivity) {
        this.connectivity = connectivity;
    }

    public String getPlaceType() {
        return placeType;
    }

    public void setPlaceType(String placeType) {
        this.placeType = placeType;
    }

    public String getOtherPlaceType() {
        return otherPlaceType;
    }

    public void setOtherPlaceType(String otherPlaceType) {
        this.otherPlaceType = otherPlaceType;
    }

    public List<AvailableConnectionCustom> getAvailableConnections() {
        return availableConnections;
    }

    public void setAvailableConnections(List<AvailableConnectionCustom> availableConnections) {
        this.availableConnections = availableConnections;
    }

    public Boolean getForceSMS() {
        return forceSMS;
    }

    public void setForceSMS(Boolean forceSMS) {
        this.forceSMS = forceSMS;
    }

    public Double getGpsLocation_lat() {
        return gpsLocation_lat;
    }

    public void setGpsLocation_lat(Double gpsLocation_lat) {
        this.gpsLocation_lat = gpsLocation_lat;
    }

    public Double getGpsLocation_lon() {
        return gpsLocation_lon;
    }

    public void setGpsLocation_lon(Double gpsLocation_lon) {
        this.gpsLocation_lon = gpsLocation_lon;
    }

    @Override
    public String toString() {
        return "SaveDataTestCustom{" +
                "macMobile='" + macMobile + '\'' +
                ", idMobile='" + idMobile + '\'' +
                ", location='" + location + '\'' +
                ", savedDateTime=" + savedDateTime +
                ", sentDateTime=" + sentDateTime +
                ", description='" + description + '\'' +
                ", attempts=" + attempts +
                ", connectivity='" + connectivity + '\'' +
                ", placeType='" + placeType + '\'' +
                ", otherPlaceType='" + otherPlaceType + '\'' +
                ", availableConnections=" + availableConnections +
                ", forceSMS=" + forceSMS +
                ", gpsLocation_lat=" + gpsLocation_lat +
                ", gpsLocation_lon=" + gpsLocation_lon +
                '}';
    }
}
