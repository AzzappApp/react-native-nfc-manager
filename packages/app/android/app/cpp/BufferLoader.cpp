
#include "BufferLoader.h"
#include "JNIHelpers.h"
#include <EGL/egl.h>
#include <EGL/eglext.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <android/log.h>
#include <android/hardware_buffer.h>
#include <android/bitmap.h>
#include <map>
#include <thread>

namespace azzapp {


#define LOG_TAG "BufferLoader"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

jni::local_ref<JBufferLoader> JBufferLoader::create(jlong bufferLoader) {
  return newInstance(bufferLoader);
}

void JBufferLoader::registerNatives() {
  javaClassStatic()->registerNatives(
      {makeNativeMethod("postTaskResult", JBufferLoader::postTaskResult)});
}

std::string JBufferLoader::loadImage(std::string uri, double width, double height) {
  static const auto loadImageMethod =
      getClass()->getMethod<jstring (std::string, jdouble, jdouble)>("loadImage");
  return loadImageMethod(self(), uri, width, height)->toStdString();
}

std::string JBufferLoader::loadVideoFrame(std::string uri, double width, double height, double time) {
  static const auto loadVideoFrameMethod =
      getClass()->getMethod<jstring (std::string, double, double, double)>("loadVideoFrame");
  return loadVideoFrameMethod(self(), uri, width, height, time)->toStdString();
}

void JBufferLoader::postTaskResult(jni::alias_ref<jni::JClass>, jlong bufferLoaderPtr,
                                     std::string taskId, jni::alias_ref<jobject> bitmap,
                                     std::string errorMessage) {
  auto receiver = reinterpret_cast<BufferLoaderHostObject*>(bufferLoaderPtr);
  receiver->handleTaskResult(taskId, bitmap, errorMessage);
}

BufferLoaderHostObject::BufferLoaderHostObject(jsi::Runtime &runtime) {
  jbufferLoader = jni::make_global(JBufferLoader::create((jlong)this));
  this->runtime = &runtime;
}

BufferLoaderHostObject::~BufferLoaderHostObject(){
  destroyOpenGL();
}

std::vector<jsi::PropNameID> BufferLoaderHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(
      jsi::PropNameID::forUtf8(rt, std::string("loadImage")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("loadVideoFrame")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("unrefBuffer")));
  return result;
}

jsi::Value BufferLoaderHostObject::get(jsi::Runtime& runtime,
                                       const jsi::PropNameID& propNameId) {
  auto propName = propNameId.utf8(runtime);
  if (propName == "loadImage") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "loadImage"), 2,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
               const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto uri = arguments[0].asString(runtime).utf8(runtime);
          double width = 0;
          double height = 0;
          if (arguments[1].isObject()) {
            auto size = arguments[1].asObject(runtime);
            width = size.getProperty(runtime, "width").asNumber();
            height = size.getProperty(runtime, "height").asNumber();
          }
          auto callback = std::make_shared<jsi::Function>(
              arguments[2].asObject(runtime).asFunction(runtime));

          auto taskId = jbufferLoader->loadImage(uri, width, height);
          tasks[taskId] = callback;

          return jsi::Value::undefined();
        });
  } else if (propName == "loadVideoFrame") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "loadVideoFrame"), 3,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
               const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto uri = arguments[0].asString(runtime).utf8(runtime);
          auto time = arguments[1].asNumber();
          double width = 0;
          double height = 0;
          if (arguments[2].isObject()) {
            auto size = arguments[2].asObject(runtime);
            width = size.getProperty(runtime, "width").asNumber();
            height = size.getProperty(runtime, "height").asNumber();
          }
          auto callback = std::make_shared<jsi::Function>(
              arguments[3].asObject(runtime).asFunction(runtime));

          auto taskId = jbufferLoader->loadVideoFrame(uri, width, height, time);
          tasks[taskId] = callback;
          return jsi::Value::undefined();
        });
  } else if (propName == "unrefBuffer") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forAscii(runtime, "unrefBuffer"), 1,
        [this](jsi::Runtime &runtime, const jsi::Value &thisValue,
           const jsi::Value *arguments, size_t count) -> jsi::Value {
          auto bufferAddress = arguments[0].asBigInt(runtime).asUint64(runtime);
          try {
            AHardwareBuffer_release(reinterpret_cast<AHardwareBuffer *>(bufferAddress));
          } catch(...) {
            __android_log_print(
                ANDROID_LOG_DEBUG, "BufferLoaderHostObject",
                "unrefBuffer failed to release");
          }
          return jsi::Value::undefined();
        });
  }
  return jsi::Value::undefined();
}

void BufferLoaderHostObject::handleTaskResult(std::string taskId, jni::alias_ref<jobject> bitmap,
                                              std::string errorMessage) {
  if (tasks.count(taskId) == 0) {
    return;
  }
  auto callback = tasks[taskId];
  tasks.erase(taskId);
  uintptr_t bufferAddress = -1;
  auto buffer = bitmapToHardwareBuffer(bitmap);
  if (buffer == nullptr) {
    if (errorMessage.size() == 0) {
      errorMessage = "Failed to retrieve buffer";
    }
  } else {
    AHardwareBuffer_acquire(buffer);
    bufferAddress = reinterpret_cast<uintptr_t>(buffer);
    buffers[bufferAddress] = taskId;
  }
  JNIHelpers::getCallInvoker()->invokeAsync([=]() {
    if (bufferAddress == -1) {
      auto error = jsi::Object(*runtime);
      error.setProperty(
          *runtime, "message",
          jsi::String::createFromUtf8(*runtime, errorMessage));
      callback->call(*runtime, error, jsi::Value::null());
    } else {
      auto jsBuffer = jsi::BigInt::fromUint64(*runtime, bufferAddress);
      callback->call(*runtime, jsi::Value::null(), jsBuffer);
    }
  });
}

bool BufferLoaderHostObject::initializeOpenGL() {
  eglDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
  if (eglDisplay == EGL_NO_DISPLAY) {
    LOGE("eglGetDisplay failed");
    return false;
  }

  if (!eglInitialize(eglDisplay, nullptr, nullptr)) {
    LOGE("eglInitialize failed");
    return false;
  }

  EGLConfig eglConfig;
  EGLint numConfigs;
  EGLint eglConfigAttribs[] = {
      EGL_SURFACE_TYPE, EGL_PBUFFER_BIT,
      EGL_BLUE_SIZE, 8,
      EGL_GREEN_SIZE, 8,
      EGL_RED_SIZE, 8,
      EGL_DEPTH_SIZE, 8,
      EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
      EGL_NONE
  };
  if (!eglChooseConfig(
      eglDisplay, eglConfigAttribs, &eglConfig, 1, &numConfigs)) {
    LOGE("eglChooseConfig failed");
    return false;
  }

  EGLint eglContextAttribs[] = {
      EGL_CONTEXT_CLIENT_VERSION, 2,
      EGL_NONE
  };
  eglContext = eglCreateContext(
      eglDisplay, eglConfig, EGL_NO_CONTEXT, eglContextAttribs);
  if (eglContext == EGL_NO_CONTEXT) {
    LOGE("eglCreateContext failed");
    return false;
  }

  EGLint pbufferAttribs[] = {
      EGL_WIDTH, 1,
      EGL_HEIGHT, 1,
      EGL_NONE,
  };
  eglSurface = eglCreatePbufferSurface(eglDisplay, eglConfig, pbufferAttribs);
  if (eglSurface == EGL_NO_SURFACE) {
    LOGE("eglCreatePbufferSurface failed");
    return false;
  }

  if (!eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
    LOGE("eglMakeCurrent failed");
    return false;
  }

  return true;
}

void BufferLoaderHostObject::destroyOpenGL() {
  if (eglDisplay != EGL_NO_DISPLAY) {
    eglMakeCurrent(eglDisplay, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    if (eglSurface != EGL_NO_SURFACE) {
      eglDestroySurface(eglDisplay, eglSurface);
    }
    if (eglContext != EGL_NO_CONTEXT) {
      eglDestroyContext(eglDisplay, eglContext);
    }
    eglTerminate(eglDisplay);
  }
  eglDisplay = EGL_NO_DISPLAY;
  eglContext = EGL_NO_CONTEXT;
}

GLuint BufferLoaderHostObject::loadTextureFromBitmap(
    JNIEnv* env, jobject bitmap, AndroidBitmapInfo bitmapInfo) {
  void* bitmapPixels;
  if (AndroidBitmap_lockPixels(env, bitmap, &bitmapPixels) < 0) {
    LOGE("AndroidBitmap_lockPixels failed");
    return 0;
  }

  GLuint texture;
  glGenTextures(1, &texture);
  glBindTexture(GL_TEXTURE_2D, texture);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  if (bitmapInfo.format != ANDROID_BITMAP_FORMAT_RGBA_8888)  {
    LOGE("Unsupported bitmap format");
    AndroidBitmap_unlockPixels(env, bitmap);
    return 0;
  }

  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA,
               bitmapInfo.width, bitmapInfo.height, 0,
               GL_RGBA, GL_UNSIGNED_BYTE, bitmapPixels);

  AndroidBitmap_unlockPixels(env, bitmap);
  return texture;
}

AHardwareBuffer* BufferLoaderHostObject::createHardwareBuffer(int width, int height) {
  AHardwareBuffer_Desc bufferDesc = {};
  bufferDesc.width = width;
  bufferDesc.height = height;
  bufferDesc.layers = 1;
  bufferDesc.format = AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM;
  bufferDesc.usage = AHARDWAREBUFFER_USAGE_GPU_SAMPLED_IMAGE | AHARDWAREBUFFER_USAGE_GPU_COLOR_OUTPUT;
  bufferDesc.stride = 0;
  bufferDesc.rfu0 = 0;
  bufferDesc.rfu1 = 0;

  AHardwareBuffer* hardwareBuffer;
  if (AHardwareBuffer_allocate(&bufferDesc, &hardwareBuffer) != 0) {
    LOGE("AHardwareBuffer_allocate failed");
    return nullptr;
  }

  return hardwareBuffer;
}


void BufferLoaderHostObject::renderToHardwareBuffer(AHardwareBuffer* hardwareBuffer, GLuint srcTexture, int width, int height) {
  EGLClientBuffer clientBuffer = eglGetNativeClientBufferANDROID(hardwareBuffer);
  EGLint eglImageAttributes[] = {
      EGL_IMAGE_PRESERVED_KHR, EGL_TRUE,
      EGL_NONE
  };
  EGLImageKHR eglImage = eglCreateImageKHR(
      eglDisplay, EGL_NO_CONTEXT, EGL_NATIVE_BUFFER_ANDROID,
      clientBuffer, eglImageAttributes);
  if (eglImage == EGL_NO_IMAGE_KHR) {
    LOGE("eglCreateImageKHR failed");
    return;
  }

  GLuint dstTexture;
  glGenTextures(1, &dstTexture);
  glBindTexture(GL_TEXTURE_2D, dstTexture);
  glEGLImageTargetTexture2DOES(GL_TEXTURE_2D, eglImage);

  if (glGetError() != GL_NO_ERROR) {
    LOGE("glEGLImageTargetTexture2DOES failed");
    eglDestroyImageKHR(eglDisplay, eglImage);
    glDeleteTextures(1, &dstTexture);
    return;
  }

  GLuint framebuffer;
  glGenFramebuffers(1, &framebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, dstTexture, 0);

  if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
    LOGE("Failed to create framebuffer");
    glDeleteTextures(1, &dstTexture);
    glDeleteFramebuffers(1, &framebuffer);
    eglDestroyImageKHR(eglDisplay, eglImage);
    return;
  }

  // Configurer la viewport et dessiner
  glViewport(0, 0, width, height);
  glClear(GL_COLOR_BUFFER_BIT);

  // Utiliser la texture source et dessiner dessus
  glBindTexture(GL_TEXTURE_2D, srcTexture);

  if (shaderProgram == -1) {
    static const char* vertexShaderSource = R"(
        attribute vec4 position;
        attribute vec2 texcoord;
        varying vec2 v_texcoord;
        void main() {
            gl_Position = position;
            v_texcoord = texcoord;
        }
    )";

    static const char* fragmentShaderSource = R"(
        precision highp float;
        varying vec2 v_texcoord;
        uniform sampler2D tex;
        void main() {
            gl_FragColor = texture2D(tex, v_texcoord);
        }
    )";

    GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, nullptr);
    glCompileShader(vertexShader);

    GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, nullptr);
    glCompileShader(fragmentShader);

    shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);

    glUseProgram(shaderProgram);

    GLuint vbo;
    GLfloat vertices[] = {
        -1.0f, -1.0f, 0.0f, 0.0f,
        1.0f, -1.0f, 1.0f, 0.0f,
        -1.0f,  1.0f, 0.0f, 1.0f,
        1.0f,  1.0f, 1.0f, 1.0f,
    };
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  } else {
    glUseProgram(shaderProgram);
  }

  GLint posAttrib = glGetAttribLocation(shaderProgram, "position");
  glEnableVertexAttribArray(posAttrib);
  glVertexAttribPointer(posAttrib, 2, GL_FLOAT, GL_FALSE,
                        4 * sizeof(GLfloat), 0);

  GLint texAttrib = glGetAttribLocation(shaderProgram, "texcoord");
  glEnableVertexAttribArray(texAttrib);
  glVertexAttribPointer(texAttrib, 2, GL_FLOAT, GL_FALSE,
                        4 * sizeof(GLfloat), (void*)(2 * sizeof(GLfloat)));

  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

  // Nettoyer les ressources
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &framebuffer);
  glDeleteTextures(1, &dstTexture);
  eglDestroyImageKHR(eglDisplay, eglImage);

  if (glGetError() != GL_NO_ERROR) {
    LOGE("OpenGL rendering error");
  }
}

AHardwareBuffer *BufferLoaderHostObject::bitmapToHardwareBuffer(jni::alias_ref<jobject> bitmapRef) {
  if(bitmapRef == nullptr) {
    return nullptr;
  }
  jobject bitmap = bitmapRef.get();
  auto env = jni::Environment::current();

  if (!eglContext) {
    if (!initializeOpenGL()) {
      return nullptr;
    }
  }
  if (!eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
    return nullptr;
  }

  AndroidBitmapInfo bitmapInfo;
  if (AndroidBitmap_getInfo(env, bitmap, &bitmapInfo) < 0) {
    LOGE("AndroidBitmap_getInfo failed");

    return nullptr;
  }

  GLuint srcTexture = loadTextureFromBitmap(env, bitmap, bitmapInfo);
  if (srcTexture == 0) {
    LOGE("Failed to load texture from bitmap");
    return nullptr;
  }
  AHardwareBuffer* hardwareBuffer = createHardwareBuffer(bitmapInfo.width, bitmapInfo.height);
  if (!hardwareBuffer) {
    LOGE("Failed to create AHardwareBuffer");
    glDeleteTextures(1, &srcTexture);
    return nullptr;
  }

  // Rendre dans le AHardwareBuffer
  renderToHardwareBuffer(hardwareBuffer, srcTexture, bitmapInfo.width, bitmapInfo.height);
  glDeleteTextures(1, &srcTexture);
  return hardwareBuffer;
}

}