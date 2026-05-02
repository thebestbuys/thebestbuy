package com.bestbuys.app;

import android.os.Bundle;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Android 15 (API 35) forces edge-to-edge for apps targeting SDK 35+, which
    // makes the WebView render behind the status and navigation bars regardless
    // of the Capacitor StatusBar plugin's overlaysWebView setting. We pad the
    // WebView with the system-bar insets so app content starts below them.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
