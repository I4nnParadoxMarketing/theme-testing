#!/bin/sh

##############################################################################
# Gradle start up script for POSIX
##############################################################################

# Resolve APP_HOME
app_path=$0
while [ -h "$app_path" ]; do
    APP_HOME=${app_path%"${app_path##*/}"}
    ls=$(ls -ld "$app_path")
    link=${ls#*' -> '}
    case $link in
      /*) app_path=$link ;;
      *) app_path=$APP_HOME$link ;;
    esac
done
APP_HOME=$(cd "${APP_HOME:-./}" && pwd -P) || exit 1

APP_NAME="Gradle"
APP_BASE_NAME=${0##*/}

if [ -n "$JAVA_HOME" ] ; then
    JAVACMD="$JAVA_HOME/bin/java"
    if [ ! -x "$JAVACMD" ] ; then
        echo "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME" >&2
        exit 1
    fi
else
    JAVACMD=java
    command -v java >/dev/null 2>&1 || {
        echo "ERROR: JAVA_HOME is not set and no java command could be found in PATH." >&2
        exit 1
    }
fi

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

exec "$JAVACMD" \
  -Xmx64m \
  -Xms64m \
  -Dorg.gradle.appname="$APP_BASE_NAME" \
  -classpath "$CLASSPATH" \
  org.gradle.wrapper.GradleWrapperMain \
  "$@"
