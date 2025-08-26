package com.example.voiceshopper.data

import android.content.Context
import com.example.voiceshopper.data.db.AppDatabase
import com.example.voiceshopper.data.db.ItemEntity
import com.example.voiceshopper.data.db.ShoppingListEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

class ShoppingRepository private constructor(private val db: AppDatabase) {

    private val itemDao = db.itemDao()
    private val listDao = db.shoppingListDao()

    suspend fun getOrCreateCurrentList(): ShoppingListEntity {
        val latest = listDao.getLatestList()
        if (latest != null) return latest
        val createdId = listDao.insert(
            ShoppingListEntity(
                name = "Today",
                createdAt = System.currentTimeMillis(),
                total = 0.0
            )
        )
        return listDao.getLatestList()!!
    }

    fun observeHistory(): Flow<List<ShoppingListEntity>> = listDao.getHistory()

    suspend fun createNewList(name: String = "Today"): ShoppingListEntity {
        val id = listDao.insert(
            ShoppingListEntity(
                name = name,
                createdAt = System.currentTimeMillis(),
                total = 0.0
            )
        )
        return listDao.getLatestList()!!
    }

    fun observeItems(listId: Long): Flow<List<ItemEntity>> = itemDao.getItemsForList(listId)

    fun observePendingItems(listId: Long): Flow<List<ItemEntity>> = itemDao.getPendingItemsForList(listId)

    fun observePendingTotal(listId: Long): Flow<Double> = itemDao.getPendingTotalForList(listId)

    suspend fun addItem(
        listId: Long,
        name: String,
        quantity: Double?,
        unit: String?,
        price: Double?,
        owner: String?
    ): Long {
        val entity = ItemEntity(
            name = name,
            quantity = quantity,
            unit = unit,
            price = price,
            owner = owner,
            createdAt = System.currentTimeMillis(),
            listId = listId,
            bought = false
        )
        return itemDao.insert(entity)
    }

    suspend fun updateItem(item: ItemEntity) = itemDao.update(item)

    suspend fun deleteItem(id: Long) = itemDao.deleteById(id)

    suspend fun setBought(id: Long, bought: Boolean) = itemDao.setBought(id, bought)

    companion object {
        @Volatile private var INSTANCE: ShoppingRepository? = null
        fun get(context: Context): ShoppingRepository = INSTANCE ?: synchronized(this) {
            val db = AppDatabase.get(context)
            INSTANCE ?: ShoppingRepository(db).also { INSTANCE = it }
        }
    }
}