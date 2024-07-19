package com.azzapp.snapshot;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AZPSnapshotModule extends ReactContextBaseJavaModule {


  private static final String NAME = "AZPSnapshotModule";

  public AZPSnapshotModule(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }


  private static final Map<String, Bitmap> snapshotMap = new HashMap<>();

  public static Map<String, Bitmap> getSnapShotMap() {
    return snapshotMap;
  }

  @ReactMethod
  public void snapshotView(final int viewTag, final Promise promise) {
    UIManagerModule uiManager = getReactApplicationContext().getNativeModule(UIManagerModule.class);
    if (uiManager == null) {
      promise.reject("not_found", "Cannot obtain uiManage");
      return;
    }
    uiManager.addUIBlock(nativeViewHierarchyManager -> {
      View view = nativeViewHierarchyManager.resolveView(viewTag);
      if (view != null) {
        Bitmap bitmap;
        try {
          bitmap = getBitmapFromView(view);
        } catch (Throwable e) {
          promise.reject("FAILED_TO_CREATE_BITMAP", e);
          return;
        }
        String uuid = UUID.randomUUID().toString();
        snapshotMap.put(uuid, bitmap);
        promise.resolve(uuid);
      } else {
        promise.reject("not_found", "View not found");
      }
    });
  }

  @ReactMethod
  public void clearSnapshot(String uuid) {
    if (uuid != null) {
      Bitmap bitmap = snapshotMap.get(uuid);
      snapshotMap.remove(uuid);
    }
  }

  public static Bitmap getBitmapFromView(View view) {
    Bitmap bitmap = Bitmap.createBitmap(view.getWidth(), view.getHeight(), Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap);
    view.draw(canvas);

    final List<View> childrenList = getAllChildren(view);
    final Paint paint = new Paint();
    paint.setAntiAlias(true);
    paint.setFilterBitmap(true);
    paint.setDither(true);

    for (final View child : childrenList) {
      // Skip any child that we don't know how to process
      if (child instanceof TextureView tvChild) {
        if (child.getVisibility() != View.VISIBLE) continue;
        tvChild.setOpaque(false);
        final Bitmap childBitmapBuffer = tvChild.getBitmap(
          Bitmap.createBitmap(child.getWidth(), child.getHeight(), Bitmap.Config.ARGB_8888));

        final int countCanvasSave = canvas.save();
        applyTransformations(canvas, view, child);

        // Due to re-use of bitmaps for screenshot, we can get bitmap that is bigger in size than requested
        canvas.drawBitmap(childBitmapBuffer, 0, 0, paint);

        canvas.restoreToCount(countCanvasSave);
        childBitmapBuffer.recycle();
      }
    }
    return bitmap;
  }

  @NonNull
  private static List<View> getAllChildren(@NonNull final View v) {
    if (!(v instanceof ViewGroup viewGroup)) {
      final ArrayList<View> viewArrayList = new ArrayList<>();
      viewArrayList.add(v);

      return viewArrayList;
    }

    final ArrayList<View> result = new ArrayList<>();

    for (int i = 0; i < viewGroup.getChildCount(); i++) {
      View child = viewGroup.getChildAt(i);

      // Do not add any parents, just add child elements
      result.addAll(getAllChildren(child));
    }

    return result;
  }

  /**
   * Concat all the transformation matrix's from parent to child.
   */
  @NonNull
  @SuppressWarnings("UnusedReturnValue")
  private static Matrix applyTransformations(final Canvas c, @NonNull final View root, @NonNull final View child) {
    final Matrix transform = new Matrix();
    final LinkedList<View> ms = new LinkedList<>();

    // Find all parents of the child view
    View iterator = child;
    do {
      ms.add(iterator);

      iterator = (View) iterator.getParent();
    } while (iterator != root);

    // Apply transformations from parent --> child order
    Collections.reverse(ms);

    for (final View v : ms) {
      // Apply each view transformations, so each child will be affected by them
      final float dx = v.getLeft() + ((v != child) ? v.getPaddingLeft() : 0) + v.getTranslationX();
      final float dy = v.getTop() + ((v != child) ? v.getPaddingTop() : 0) + v.getTranslationY();
      c.translate(dx, dy);
      transform.postTranslate(dx, dy);

      c.rotate(v.getRotation(), v.getPivotX(), v.getPivotY());
      transform.postRotate(v.getRotation(), v.getPivotX(), v.getPivotY());

      c.scale(v.getScaleX(), v.getScaleY(), v.getPivotX(), v.getPivotY());
      transform.postScale(v.getScaleX(), v.getScaleY(), v.getPivotX(), v.getPivotY());
    }

    return transform;
  }
}
