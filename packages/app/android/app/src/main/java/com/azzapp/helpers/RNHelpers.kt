package com.azzapp.helpers

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

object RNHelpers {

  fun readableArrayToStringArrayList(value: ReadableArray?): ArrayList<String>? {
    if (value == null) {
      return null
    }
    val result = ArrayList<String>()

    for (index in 0 until value.size()) {
      when (value.getType(index)) {
        ReadableType.String -> result.add(value.getString(index))
        else -> Log.e("RNHelpers", "Could not convert object with index: $index to String.")
      }
    }
    return result
  }

  fun readableMapToString(value: ReadableMap): String =
    sortHashMapDeep(value.toHashMap()).toString()

  fun readDoubleIfHasKey(readableMap: ReadableMap, key: String): Double? {
    if (readableMap.hasKey(key)) {
      return readableMap.getDouble(key)
    }
    return null
  }


  private fun sortHashMapDeep(value: Map<String, Any>): Map<String, Any> =
    value.mapValues { value ->
      if (value is Map<*, *>) sortHashMapDeep(value as Map<String, Any>) else value
    }.toSortedMap()

}