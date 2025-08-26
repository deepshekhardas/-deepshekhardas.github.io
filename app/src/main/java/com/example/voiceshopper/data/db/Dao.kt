package com.example.voiceshopper.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ShoppingListDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(list: ShoppingListEntity): Long

    @Update
    suspend fun update(list: ShoppingListEntity)

    @Query("SELECT * FROM shopping_lists ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLatestList(): ShoppingListEntity?

    @Query("SELECT * FROM shopping_lists ORDER BY createdAt DESC")
    fun getHistory(): Flow<List<ShoppingListEntity>>
}

@Dao
interface ItemDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: ItemEntity): Long

    @Update
    suspend fun update(item: ItemEntity)

    @Query("DELETE FROM items WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT * FROM items WHERE listId = :listId ORDER BY createdAt DESC")
    fun getItemsForList(listId: Long): Flow<List<ItemEntity>>

    @Query("SELECT * FROM items WHERE listId = :listId AND bought = 0 ORDER BY createdAt DESC")
    fun getPendingItemsForList(listId: Long): Flow<List<ItemEntity>>

    @Query("UPDATE items SET bought = :bought WHERE id = :id")
    suspend fun setBought(id: Long, bought: Boolean)

    @Query("SELECT IFNULL(SUM(price), 0.0) FROM items WHERE listId = :listId AND bought = 0")
    fun getPendingTotalForList(listId: Long): Flow<Double>
}