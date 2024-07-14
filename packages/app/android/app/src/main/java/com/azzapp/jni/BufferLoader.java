package com.azzapp.jni;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.hardware.HardwareBuffer;
import android.media.ExifInterface;
import android.media.Image;
import android.media.ImageReader;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.util.Log;

import com.azzapp.MainApplication;
import com.bumptech.glide.Glide;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BufferLoader {
  private final ExecutorService executorService = Executors.newCachedThreadPool();

  private final long bufferLoaderPtr;

  public BufferLoader(long bufferLoaderPtr) {
    this.bufferLoaderPtr = bufferLoaderPtr;
  }

  public String loadImage(String uri, double width, double height) {
    return enqueueTask(width, height, () ->
      Glide
        .with(MainApplication.Companion.getMainApplicationContext())
        .asBitmap()
        .load(uri)
        .submit()
        .get()
    );
  }

  public String loadVideoFrame(String uriStr, double width, double height, double time) {
    return enqueueTask(width, height, () -> {
      Uri uri = Uri.parse(uriStr);
      if (uri == null) {
        throw new IOException("Invalid url");
      }
      MediaMetadataRetriever retriever = new MediaMetadataRetriever();
      if (Objects.equals(uri.getScheme(), "file")) {
        retriever.setDataSource(MainApplication.Companion.getMainApplicationContext(), uri);
      } else {
        retriever.setDataSource(uri.toString(), new HashMap<>());
      }
      Bitmap bitmap = retriever.getFrameAtTime(Math.round(time * 1000000));
      retriever.release();

      return bitmap;
    });
  }

  private String enqueueTask(double width, double height, BitmapLoader loader) {
    String taskId = UUID.randomUUID().toString();
    executorService.execute(() -> {
      Bitmap bitmap = null;
      try {
        bitmap = loader.load();
      } catch (Exception e) {
        postTaskResult(bufferLoaderPtr, taskId, null, e.getMessage());
        return;
      }
      if (bitmap == null) {
        postTaskResult(bufferLoaderPtr, taskId, null, "Failed to retrieve bitmap");
        return;
      }
      if (width != 0 && height != 0 &&
        (bitmap.getWidth() > width || bitmap.getHeight() > height)) {
        double aspectRatio = (double) bitmap.getWidth() / bitmap.getHeight();
        if (aspectRatio > width / height) {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) width, (int) (width / aspectRatio), true);
        } else {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) (height * aspectRatio), (int) height, true);
        }
      }
      if (bitmap.getConfig() != Bitmap.Config.ARGB_8888) {
        bitmap = convertToARGB_8888(bitmap);
      }
      postTaskResult(bufferLoaderPtr, taskId, bitmap, null);
    });
    return taskId;
  }



  public Bitmap convertToARGB_8888(Bitmap bitmap) {
    Bitmap result = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(result);
    Paint paint = new Paint();
    canvas.drawBitmap(bitmap, 0, 0, paint);
    return result;
  }

  private static native void postTaskResult(long bufferLoaderPtr, String taskId, Object bitmap, String e);

  private interface BitmapLoader {
    Bitmap load() throws IOException, ExecutionException, InterruptedException;
  }

}
