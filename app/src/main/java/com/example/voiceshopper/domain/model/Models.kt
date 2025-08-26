package com.example.voiceshopper.domain.model

import com.example.voiceshopper.data.db.ItemEntity
import com.example.voiceshopper.data.db.ShoppingListEntity

data class ShoppingList(
    val id: Long,
    val name: String,
    val createdAt: Long,
    val total: Double
)

data class Item(
    val id: Long,
    val name: String,
    val quantity: Double?,
    val unit: String?,
    val price: Double?,
    val owner: String?,
    val createdAt: Long,
    val bought: Boolean,
    val listId: Long
)

fun ShoppingListEntity.toDomain() = ShoppingList(id, name, createdAt, total)
fun ItemEntity.toDomain() = Item(id, name, quantity, unit, price, owner, createdAt, bought, listId)