package com.azzapp.gpu

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.media.effect.EffectContext
import android.net.Uri
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.widget.FrameLayout
import com.azzapp.gpu.effects.BlendEffect
import com.azzapp.gpu.effects.ColorLUTEffect
import com.azzapp.gpu.effects.TintColorEffect
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import java.util.concurrent.atomic.AtomicInteger
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import javax.microedition.khronos.opengles.GL10
import kotlin.math.round

class GPUImageView(context: Context) : FrameLayout(context), GLSurfaceView.Renderer {

    private val surfaceView = GLSurfaceView(context)

    private var layers: List<GPULayer>? = null

    private var bitmaps = mutableMapOf<String, Bitmap>()
    private var frames = mutableMapOf<String, GLFrame>()

    private var frameBufferPool = FrameBufferPool()

    private var readyToDraw  = false

    private var blendEffect: BlendEffect? = null
    private var colorLutEffect: ColorLUTEffect? = null
    private var tintColorEffect: TintColorEffect? = null
    private var effectContext: EffectContext? = null

    private var surfaceWidth = 0
    private var surfaceHeight = 0

    private var created = false


    init {
        surfaceView.setEGLContextFactory(EGLSharedContextFactory(this))
        surfaceView.setEGLConfigChooser(8, 8, 8, 8, 0, 0)
        surfaceView.setEGLContextClientVersion(2)
        surfaceView.setRenderer(this)
        surfaceView.preserveEGLContextOnPause = true
        surfaceView.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY
        surfaceView.holder.setFormat(PixelFormat.TRANSLUCENT);

        addView(surfaceView)
    }

    fun getLayers(): List<GPULayer>? {
        return layers
    }

    fun setLayers(layers: List<GPULayer>?) {
        if (layers == this.layers) {
            return;
        }
        this.layers = layers;
        loadSourcesIfNecessary()
        surfaceView.requestRender()
    }

    private fun dispatchEvent(event: String, e: Exception?) {
        val context = context as ThemedReactContext
        val eventListener = context.getJSModule(RCTEventEmitter::class.java)
        val params = WritableNativeMap()
        if (e != null) {
            params.putString("error", e?.message)
        }
        eventListener.receiveEvent(
                this.id,
                event,
                params
        )
    }

    private var _backgroundColor: Int = Color.BLACK
    override fun setBackgroundColor(color: Int) {
        if (_backgroundColor == color) {
            return;
        }
        this._backgroundColor = color
        surfaceView.requestRender()
    }

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        // nothing
        created = true
        GLES20.glDisable(GLES20.GL_DEPTH_TEST)

        GLES20.glEnable(GLES20.GL_BLEND);
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        surfaceWidth = width
        surfaceHeight = height
    }

    override fun onDrawFrame(gl: GL10?) {
        if (!created) {
            return
        }

        val bgColor = _backgroundColor
        GLES20.glClearColor(
            (bgColor shr 16 and 0xff) / 255.0f,
            (bgColor shr 8 and 0xff) / 255.0f,
            (bgColor and 0xff) / 255.0f,
            1.0f //(color shr 24 and 0xff) / 255.0f
        )
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

        var unusedFramesKey = mutableListOf<String>()
        for (key in frames.keys) {
            if (!bitmaps.contains(key)) {
                unusedFramesKey.add(key)
            }
        }
        unusedFramesKey.forEach {
            frames[it]?.release()
            frames.remove(it)
        }

        if (!readyToDraw) {
            return;
        }

        for ((key, bitmap) in bitmaps) (
            if (!frames.contains(key)) {
                val frame = GLFrame.sharedFrame(key) {
                    val glFrame = GLFrame.create(bitmap.width, bitmap.height)
                    ShaderUtils.bindImageTexture(glFrame.texture, bitmap)
                    glFrame
                } ?: return
                frames[key] = frame
            }
        )

        var layers = layers ?: return

        for (layer in layers) {
            val sourceImage = frames[layer.source.stringRepresentation()] ?: continue
            var image = sourceImage

            fun setImage(value: GLFrame) {
                if (image !== sourceImage && value !== image) {
                    image.release()
                }
                image = value
            }

            if (layer.backgroundColor != null && layer.backgroundColor.lowercase() != "transparent") {
                val color = try {
                    Color.parseColor(layer.backgroundColor)
                } catch (e: IllegalArgumentException){
                    Color.BLACK
                }
                val r = (color shr 16 and 0xff) / 255.0f
                val g = (color shr 8 and 0xff) / 255.0f
                val b = (color and 0xff) / 255.0f
                val a = (color shr 24 and 0xff) / 255.0f
                GLES20.glClearColor(r, g, b, a)
                GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
            }

            val maskImage = if (layer.maskUri != null)
                frames[layer.maskUri.toString()] ?: continue
            else null

            if (maskImage != null) {
                var blendEffect = this.blendEffect
                if (blendEffect == null) {
                    blendEffect = BlendEffect()
                    this.blendEffect = blendEffect
                }
                setImage(blendEffect.draw(image, maskImage, frameBufferPool))
            }

            if (layer.tintColor != null) {
                val color = try { Color.parseColor(layer.tintColor) } catch (e: IllegalArgumentException){ Color.BLACK }
                var tintColorEffect = this.tintColorEffect
                if (tintColorEffect == null) {
                    tintColorEffect = TintColorEffect()
                    this.tintColorEffect = tintColorEffect
                }
                setImage(tintColorEffect.draw(image, color, frameBufferPool))
            }

            val parameters = layer.parameters
            if (parameters != null) {
                if (effectContext == null) {
                    effectContext = EffectContext.createWithCurrentGlContext()
                }
                val transformedImage = GLFrameTransformations.applyEditorTransform(
                    image,
                    parameters,
                    effectContext!!.factory
                )
                setImage(transformedImage)
                GLES20.glEnable(GLES20.GL_BLEND)
                GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
            }

            val lutImage = if (layer.lutFilterUri != null)
                frames[layer.lutFilterUri.toString()] ?: continue
            else null

            if (lutImage != null) {
                var colorLutEffect = this.colorLutEffect
                if (colorLutEffect == null) {
                    colorLutEffect = ColorLUTEffect()
                    this.colorLutEffect = colorLutEffect
                }
                setImage(
                    colorLutEffect.draw(
                        image,
                        lutImage,
                        frameBufferPool,
                    )
                )
            }

            textureRenderer?.renderTexture(
                image.texture,
                ShaderUtils.IDENT_MATRIX,
                round(image.x * surfaceWidth.toFloat() / image.width.toFloat()).toInt(),
                -round(image.y * surfaceHeight.toFloat() / image.height.toFloat()).toInt(),
                surfaceWidth,
                surfaceHeight
            )

            if (image !== sourceImage) {
                image.release()
            }
        }
    }

    private var loadSourceJob: Deferred<Any>? = null
    private fun loadSourcesIfNecessary() {
        loadSourceJob?.cancel()

        val layers = this.layers ?: return

        val bitmapToLoads = mutableListOf<Any>()
        val usedKeys = mutableSetOf<String>()

        for (layer in layers) {
            val key = layer.source.stringRepresentation()
            usedKeys.add(key)
            if (!bitmaps.contains(key)) {
                bitmapToLoads.add(layer.source)
            }
            val maskUri = layer.maskUri
            if (maskUri != null) {
                val key = maskUri.toString()
                usedKeys.add(key)
                if (!bitmaps.contains(key)) {
                    bitmapToLoads.add(maskUri)
                }
            }
            val lutFilterUri = layer.lutFilterUri
            if (lutFilterUri != null) {
                val key = lutFilterUri.toString()
                usedKeys.add(key)
                if (!bitmaps.contains(key)) {
                    bitmapToLoads.add(lutFilterUri)
                }
            }
        }

        val unusedKeys = mutableListOf<String>()
        for (key in bitmaps.keys) {
            if(!usedKeys.contains(key)) {
                unusedKeys.add(key)
            }
        }
        unusedKeys.forEach {
            bitmaps.remove(it)
        }

        readyToDraw = bitmapToLoads.size == 0;

        if (readyToDraw) {
            return;
        }

        dispatchEvent(GPUImageViewManager.ON_LOAD_START, null)
        loadSourceJob = GlobalScope.async {
            try {
                bitmapToLoads
                    .map { uriOrSource ->
                        async(Dispatchers.IO) {
                            if (uriOrSource is Uri) {
                                Pair(uriOrSource, GPULayerImageLoader.loadImage(uriOrSource))
                            } else if (uriOrSource is GPULayer.GPULayerSource) {
                                Pair(uriOrSource, GPULayerImageLoader.loadGPULayerSource(uriOrSource))
                            } else {
                                null
                            }
                        }
                    }
                    .awaitAll()
                    .filterNotNull()
                    .forEach {(uriOrSource, bitmap) ->
                        val key = if (uriOrSource is GPULayer.GPULayerSource) {
                            uriOrSource.stringRepresentation()
                        } else {
                            uriOrSource.toString()
                        }
                        bitmaps[key] = bitmap

                    }
                readyToDraw = true
                dispatchEvent(GPUImageViewManager.ON_LOAD, null)
                surfaceView.requestRender()
            } catch (e: CancellationException) {
                // do nothing
            } catch (e: Exception) {
                dispatchEvent(GPUImageViewManager.ON_ERROR, e)
            }
        }
    }

    private fun clean() {
        loadSourceJob?.cancel()
        loadSourceJob = null
        frames.values.forEach{ it.release() }
        frames.clear()
        effectContext?.release()
        effectContext = null
        frameBufferPool.release()
    }

    companion object {
        private const val TAG = "GPUImageView"

        private var sharedContext: EGLContext? = null
        private var sharedContextDisplay: EGLDisplay? = null
        private var contextRefCount = AtomicInteger(0)
        private var textureRenderer: TextureRenderer? = null


        fun getSharedContext(): EGLContext = sharedContext ?: EGL10.EGL_NO_CONTEXT


        private class EGLSharedContextFactory(private val view: GPUImageView) :
                GLSurfaceView.EGLContextFactory {

            override fun createContext(
                    egl: EGL10,
                    display: EGLDisplay?,
                    config: EGLConfig?
            ): EGLContext? {
                contextRefCount.incrementAndGet()
                val attrib = intArrayOf(
                        ShaderUtils.EGL_CONTEXT_CLIENT_VERSION,
                        2,
                        EGL10.EGL_NONE
                )

                synchronized(GPUImageView) {
                    if (sharedContext == null) {
                        sharedContextDisplay = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)
                        sharedContext = egl.eglCreateContext(
                                sharedContextDisplay,
                                config,
                                EGL10.EGL_NO_CONTEXT,
                                attrib
                        )
                        egl.eglMakeCurrent(display, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, sharedContext)
                        textureRenderer = TextureRenderer(false, true)
                    }
                }

                return egl.eglCreateContext(
                        display,
                        config,
                        sharedContext,
                        attrib
                )
            }

            override fun destroyContext(
                    egl: EGL10,
                    display: EGLDisplay,
                    context: EGLContext
            ) {
                egl.eglMakeCurrent(display, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, context)
                view.clean()
                destroyContextInner(egl, display, context)

                synchronized(GPUImageView) {
                    if (contextRefCount.decrementAndGet() < 0 && sharedContext != null) {
                        destroyContextInner(egl, sharedContextDisplay!!, sharedContext!!)
                        sharedContext = null
                        sharedContextDisplay = null
                        textureRenderer = null
                    }
                }
            }

            fun destroyContextInner(
                    egl: EGL10,
                    display: EGLDisplay,
                    context: EGLContext
            ) {
                if (!egl.eglDestroyContext(display, context)) {
                    Log.e("EGLContextManager", "display:$display context: $context")
                    val error = egl.eglGetError()
                    throw RuntimeException("Error while destroying egl context $error")
                }
            }
        }
    }
}
