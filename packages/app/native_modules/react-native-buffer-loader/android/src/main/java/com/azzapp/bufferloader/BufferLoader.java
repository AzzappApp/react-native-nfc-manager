package com.azzapp.bufferloader;

import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.opengl.EGL14;
import android.opengl.GLES20;
import android.opengl.GLU;
import android.opengl.GLUtils;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.bumptech.glide.Glide;

import java.io.IOException;
import java.util.HashMap;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

public class BufferLoader {
  private final ExecutorService executorService = Executors.newSingleThreadExecutor();

  private final long bufferLoaderPtr;
  private EGLContext sharedContext;
  private EGL10 egl  = null;
  private EGLContext context = null;
  private EGLSurface surface = null;
  private EGLDisplay display = null;

  public BufferLoader(long bufferLoaderPtr) {
    this.bufferLoaderPtr = bufferLoaderPtr;
  }

  public String loadImage(String uriStr, double width, double height) {
    return enqueueTask(width, height, () -> {
        Uri uri = Uri.parse(uriStr);
        if (uriStr != null && (uri == null || uri.getScheme() == null)) {
          int resId = AzzappRNBufferLoaderModule.currentReactApplicationContext()
            .getResources()
            .getIdentifier(uriStr, "drawable",
              AzzappRNBufferLoaderModule.currentReactApplicationContext().getPackageName());
          if (resId != 0) {
            uri = Uri.parse("android.resource://"
              + AzzappRNBufferLoaderModule.currentReactApplicationContext().getPackageName()
              + "/" + resId);
          } else {
            throw new IllegalArgumentException("Invalid URI or asset ID: " + uriStr);
          }
        }
        return Glide
          .with(AzzappRNBufferLoaderModule.currentReactApplicationContext())
          .asBitmap()
          .load(uri)
          .submit()
          .get();
      }
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

  public void releaseTexture(int texId) {
    executorService.execute(() -> {
      if (context == null) {
        return;
      }
      egl.eglMakeCurrent(display, surface, surface, context);
      purgeOpenGLError();
      int[] textures = {texId};
      GLES20.glDeleteTextures(1, textures, 0);
      checkGlError("glDeleteTextures");
    });
  }

  private String enqueueTask(double width, double height, BitmapLoader loader) {
    String taskId = UUID.randomUUID().toString();
    if(sharedContext == null) {
      Handler mainHandler = new Handler(Looper.getMainLooper());
      CompletableFuture<Void> completableFuture = new CompletableFuture<>();
      mainHandler.post(() -> {
        sharedContext = ((EGL10) EGLContext.getEGL()).eglGetCurrentContext();
        if (sharedContext == EGL10.EGL_NO_CONTEXT) {
          completableFuture.completeExceptionally(new RuntimeException("Skia context is not initialized"));
        } else {
          completableFuture.complete(null);
        }
      });
      try {
        completableFuture.get();
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
    executorService.execute(() -> {
      Bitmap bitmap = null;
      try {
        bitmap = loader.load();
      } catch (Exception e) {
        postFailure(taskId, e.getMessage());
      }
      if (bitmap == null) {
        postFailure(taskId, "Failed to retrieve bitmap");
        return;
      }
      int textureWidth = bitmap.getWidth();
      int textureHeight = bitmap.getHeight();
      if (width != 0 && height != 0 &&
        (textureWidth > width || textureHeight > height)) {
        double aspectRatio = (double) bitmap.getWidth() / bitmap.getHeight();
        if (aspectRatio > width / height) {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) width, (int) (width / aspectRatio), true);
        } else {
          bitmap = Bitmap.createScaledBitmap(bitmap, (int) (height * aspectRatio), (int) height, true);
        }
        textureWidth = bitmap.getWidth();
        textureHeight = bitmap.getHeight();
      }
      if (bitmap.getConfig() != Bitmap.Config.ARGB_8888) {
        bitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true);
      }

      if (context == null) {
        egl = (EGL10) EGLContext.getEGL();
        display = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY);

        EGLConfig[] configs = new EGLConfig[1];
        int[] numConfigs = new int[1];
        int[] configAttributes = new int[]{
          EGL10.EGL_RED_SIZE, 8,
          EGL10.EGL_GREEN_SIZE, 8,
          EGL10.EGL_BLUE_SIZE, 8,
          EGL10.EGL_ALPHA_SIZE, 8,
          EGL10.EGL_DEPTH_SIZE, 0,
          EGL10.EGL_STENCIL_SIZE, 0,
          EGL10.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
          EGL14.EGL_CONFIG_CAVEAT, EGL14.EGL_NONE,
          EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
          EGL10.EGL_NONE
        };
        boolean success =
          egl.eglChooseConfig(
            display,
            configAttributes,
            configs,
            1,
            numConfigs
          );

        if (!success) {
          throw new RuntimeException("No egl config found");
        }
        EGLConfig config = configs[0];

        int[] glAttributes = new int[]{EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL10.EGL_NONE};
        context = egl.eglCreateContext(display, config, sharedContext, glAttributes);

        int[] surfaceAttributes = {
          EGL10.EGL_WIDTH,
          1,
          EGL10.EGL_HEIGHT,
          1,
          EGL10.EGL_NONE
        };
        surface = egl.eglCreatePbufferSurface(display, config, surfaceAttributes);
      }
      egl.eglMakeCurrent(display, surface, surface, context);

      int[] textureIds = new int[1];
      GLES20.glGenTextures(1, textureIds, 0);
      int textureId = textureIds[0];
      if (textureId == 0) {
        postFailure(taskId, "Failed to generate texture");
        return;
      }

      GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId);
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
      GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);

      // Charge le bitmap dans la texture OpenGL
      GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0);

      postTaskResult(bufferLoaderPtr, taskId, textureId, textureWidth, textureHeight, null);
    });
    return taskId;
  }

  public void release() {
    if (surface != null) {
      egl.eglDestroySurface(display, surface);
    }
    if (context != null) {
      egl.eglDestroyContext(display, context);
    }
  }


  private void postFailure(String taskId, String errorMessage) {
    postTaskResult(bufferLoaderPtr,taskId, -1, 0, 0, errorMessage);
  }

  private static native void postTaskResult(
    long bufferLoaderPtr,
    String taskId,
    int texId,
    int width,
    int height,
    String e
  );

  private interface BitmapLoader {
    Bitmap load() throws IOException, ExecutionException, InterruptedException;
  }

  private static void purgeOpenGLError() {
    int i = 0;
    while (true) {
      if (GLES20.glGetError() == GLES20.GL_NO_ERROR || i >= 9) {
        break;
      }
      i++;
    }
  }

  /**
   * Check for OpenGL errors and throw an exception if an error is found.
   *
   * @param prefix the prefix to add to the error message
   */
  private static void checkGlError(String prefix) {
    StringBuilder errorMessageBuilder = new StringBuilder();
    boolean foundError = false;
    int error;
    if (prefix != null) {
      errorMessageBuilder.append(prefix).append(": ");
    }
    while ((error = GLES20.glGetError()) != GLES20.GL_NO_ERROR) {
      if (foundError) {
        errorMessageBuilder.append('\n');
      }
      String errorString = GLU.gluErrorString(error);
      if (errorString == null) {
        errorString = "error code: 0x" + Integer.toHexString(error);
      } else {
        errorString = "error code: 0x" + Integer.toHexString(error) + " " + errorString;
      }
      errorMessageBuilder.append("glError: ").append(errorString);
      foundError = true;
    }
    if (foundError) {
      Log.e("RNBufferLoader", errorMessageBuilder.toString());
    }
  }

}
