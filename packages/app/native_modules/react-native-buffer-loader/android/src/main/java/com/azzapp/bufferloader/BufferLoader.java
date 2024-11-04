package com.azzapp.bufferloader;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.PixelFormat;
import android.hardware.HardwareBuffer;
import android.media.Image;
import android.media.ImageReader;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.util.Log;

import com.bumptech.glide.Glide;

import java.io.IOException;
import java.util.HashMap;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BufferLoader {
  private final ExecutorService executorService = Executors.newCachedThreadPool();

  private final HashMap<String, BufferResources> bufferResources = new HashMap<>();

  private final long bufferLoaderPtr;

  public BufferLoader(long bufferLoaderPtr) {
    this.bufferLoaderPtr = bufferLoaderPtr;
  }

  public String loadImage(String uri, double width, double height) {
    return enqueueTask(width, height, () ->
      Glide
        .with(AzzappRNBufferLoaderModule.currentReactApplicationContext())
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
        retriever.setDataSource(AzzappRNBufferLoaderModule.currentReactApplicationContext(), uri);
      } else {
        retriever.setDataSource(uri.toString(), new HashMap<>());
      }
      Bitmap bitmap = retriever.getFrameAtTime(Math.round(time * 1000000));
      retriever.release();
      return bitmap;
    });
  }

  public void releaseBuffer(String bufferId) {
    BufferResources resources = bufferResources.get(bufferId);
    if (resources == null) {
      Log.w("BufferLoaderHostObject", "Cleaning buffer that is not registered");
      return;
    }
    try {
      resources.hardwareBuffer.close();
      resources.image.close();
      resources.imageReader.close();
    } catch (Exception e) {
      Log.w("BufferLoaderHostObject", "Error while disposing resources", e);
    }
    bufferResources.remove(bufferId);
  }

  private String enqueueTask(double width, double height, BitmapLoader loader) {
    String taskId = UUID.randomUUID().toString();
    executorService.execute(() -> {
      Bitmap bitmap = null;
      try {
        bitmap = loader.load();
      } catch (Exception e) {
        postTaskResult(bufferLoaderPtr, taskId, null, e.getMessage());
      }
      if (bitmap == null) {
        postTaskResult(bufferLoaderPtr, taskId, null, "Failed to retrieve bitmap");
        return;
      }
      if (width != 0 && height != 0 && bitmap != null &&
        (bitmap.getWidth() > width || bitmap.getHeight() > height)) {
        double aspectRatio = (double) bitmap.getWidth() / bitmap.getHeight();
        if (aspectRatio > width / height) {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) width, (int) (width / aspectRatio), true);
        } else {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) (height * aspectRatio), (int) height, true);
        }
      }
      ImageReader imageReader;
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        imageReader = ImageReader.newInstance(
          bitmap.getWidth(), bitmap.getHeight(),
          PixelFormat.RGBA_8888, 1,
          HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
        );
      } else {
        imageReader = ImageReader.newInstance(
          bitmap.getWidth(), bitmap.getHeight(),
          PixelFormat.RGBA_8888, 1
        );
      }

      Canvas canvas = null;
      try {
        canvas = imageReader.getSurface().lockCanvas(null);
        canvas.drawBitmap(bitmap, 0, 0, null);
      } finally {
        if (canvas != null) {
          imageReader.getSurface().unlockCanvasAndPost(canvas);
        }
      }

      Image image = imageReader.acquireLatestImage();
      if (image == null) {
        imageReader.close();
        postTaskResult(bufferLoaderPtr, taskId, null, "Failed to retrieve image");
        return;
      }
      HardwareBuffer buffer = image.getHardwareBuffer();
      if (buffer == null) {
        image.close();
        imageReader.close();
        postTaskResult(bufferLoaderPtr, taskId, null, "Failed to retrieve buffer");
        return;
      }
      bufferResources.put(taskId, new BufferResources(
        imageReader,
        image,
        buffer
      ));
      postTaskResult(bufferLoaderPtr, taskId, buffer, null);
    });
    return taskId;
  }

  private static native void postTaskResult(long bufferLoaderPtr, String taskId, Object buffer, String e);

  private interface BitmapLoader {
    Bitmap load() throws IOException, ExecutionException, InterruptedException;
  }

  private record BufferResources(
    ImageReader imageReader,
    Image image,
    HardwareBuffer hardwareBuffer
  ) {
  }
}
