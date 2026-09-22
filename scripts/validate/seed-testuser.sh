#!/bin/bash
# Insert (or reset) the local dev login on the emulator so V6 never needs the auth server.
#   scripts/validate/seed-testuser.sh [agent|admin]     default: agent
# login: testuser  password: test1234  collection point: the one the phone is configured for.
export MSYS_NO_PATHCONV=1
PKG=com.crseneagalmobile.dev
ROLE=$([ "${1:-agent}" = "admin" ] && echo MOBILITY_ADM || echo MOBILITY_AGENT)
HASH='$2a$12$8y/D7DcpFy8Mbs21vG6TEuQFNQc0.wgjofeC1ejvWYGXYTPEkl4SO'   # bcrypt("test1234", cost 12)
CP=$(adb shell "run-as $PKG sqlite3 databases/dbSenegal.db 'select code from collection_point where phoneCollectionPoint=1 limit 1;'" | tr -d '\r')
if [ -z "$CP" ]; then echo "No phone collection point set yet - open the app once and pick one on the login screen."; exit 1; fi
OUT="$(cd "$(dirname "$0")" && pwd)/out"; mkdir -p "$OUT"; SQL="$OUT/seed.sql"; cat > "$SQL" <<SQLEOF
DELETE FROM user WHERE login='testuser';
INSERT INTO user (login,password,firstname,lastname,role,token,expiration_datetime,collection_point_code,user_code)
VALUES ('testuser','$HASH','Test','User','$ROLE','local-dev-token',4102444800000,'$CP','TESTUSER');
SELECT login,role,collection_point_code FROM user;
SQLEOF
adb push "$(cygpath -m "$SQL")" /data/local/tmp/seed.sql >/dev/null || { echo "adb push failed"; exit 1; }; adb shell "run-as $PKG sh -c 'sqlite3 databases/dbSenegal.db < /data/local/tmp/seed.sql'"; adb shell rm -f /data/local/tmp/seed.sql; rm -f "$SQL"
