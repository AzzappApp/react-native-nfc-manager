package com.azzapp.snapshot;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.SimpleViewManager;

public class AZPSnapshotManager extends SimpleViewManager<AZPSnapshot> {

  private static final String REACT_CLASS = "AZPSnapshot";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected AZPSnapshot createViewInstance(ThemedReactContext reactContext) {
    return new AZPSnapshot(reactContext);
  }

  @ReactProp(name = "snapshotID")
  public void setSnapshotID(AZPSnapshot view, String snapshotID) {
    view.setSnapshotID(snapshotID);
  }
}
