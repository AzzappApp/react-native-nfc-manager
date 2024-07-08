package com.azzapp.snapshot;

import android.content.Context;

import androidx.appcompat.widget.AppCompatImageView;

public class AZPSnapshot extends AppCompatImageView {

  private String snapshotID;

  public AZPSnapshot(Context context) {
    super(context);
  }

  public void setSnapshotID(String snapshotID) {
    if (!snapshotID.equals(this.snapshotID)) {
      this.snapshotID = snapshotID;
      if (snapshotID == null) {
        this.setImageBitmap(null);
        return;
      }
      this.setImageBitmap(AZPSnapshotModule.getSnapShotMap().get(snapshotID));
    }
  }
}
