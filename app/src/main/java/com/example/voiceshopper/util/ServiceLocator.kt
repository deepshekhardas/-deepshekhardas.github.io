package com.example.voiceshopper.util

import android.content.Context
import com.example.voiceshopper.data.ShoppingRepository

object ServiceLocator {
    fun shoppingRepository(context: Context): ShoppingRepository = ShoppingRepository.get(context)
}