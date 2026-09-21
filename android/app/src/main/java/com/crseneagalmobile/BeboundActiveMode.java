package com.crseneagalmobile;

public class BeboundActiveMode {

    private BeBoundEnumMode mode;

    private BeboundActiveMode() {
    }

    public static BeboundActiveMode getInstance() {
        return BeboundActiveMode.SingletonHolder.instance;
    }

    public BeBoundEnumMode getMode() {
        return mode;
    }

    public void setMode(BeBoundEnumMode mode) {
        this.mode = mode;
    }


    private static class SingletonHolder {

        private final static BeboundActiveMode instance = new BeboundActiveMode();
    }

    public enum BeBoundEnumMode {


        SUBSCRIPTION("SUBSCRIPTION"),
        TRANSMISSION("TRANSMISSION");

        private String mode;

        BeBoundEnumMode(String mode) {
            this.mode = mode;
        }

        public String mode() {
            return mode;
        }
    }


}

