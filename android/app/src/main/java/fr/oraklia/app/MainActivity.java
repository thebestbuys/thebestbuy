package fr.oraklia.app;

import com.getcapacitor.BridgeActivity;

// Android 15 (API 35) renders the WebView edge-to-edge (under the status/nav
// bars and the camera cutout). Rather than pad the WebView natively (which is
// unreliable and can swallow the insets), we let it stay edge-to-edge and the
// web layer reserves the safe areas via CSS env(safe-area-inset-*) — see the
// "Safe-area insets (native)" block in src/styles.css. viewport-fit=cover in
// index.html is what exposes those env() values to the page.
public class MainActivity extends BridgeActivity {
}
