<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'

const items = ref([])
const newItemName = ref('')
const newItemDesc = ref('')

// Stan edycji
const editingId = ref(null)
const editName = ref('')
const editDesc = ref('')

// Pobieranie danych (Read)
const fetchItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('id', { ascending: true })
  
  if (error) console.error('Błąd pobierania:', error)
  else items.value = data
}

// Dodawanie danych (Create)
const addItem = async () => {
  if (!newItemName.value) return
  
  const { error } = await supabase
    .from('items')
    .insert([{ name: newItemName.value, description: newItemDesc.value }])
    
  if (error) {
    console.error('Błąd dodawania:', error)
  } else {
    newItemName.value = ''
    newItemDesc.value = ''
    fetchItems()
  }
}

// Usuwanie danych (Delete)
const deleteItem = async (id) => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    
  if (error) console.error('Błąd usuwania:', error)
  else fetchItems()
}

// Rozpoczęcie edycji
const startEdit = (item) => {
  editingId.value = item.id
  editName.value = item.name
  editDesc.value = item.description
}

// Anulowanie edycji
const cancelEdit = () => {
  editingId.value = null
  editName.value = ''
  editDesc.value = ''
}

// Zapisanie edycji (Update)
const saveEdit = async () => {
  const { error } = await supabase
    .from('items')
    .update({ name: editName.value, description: editDesc.value })
    .eq('id', editingId.value)
    
  if (error) {
    console.error('Błąd aktualizacji:', error)
  } else {
    cancelEdit()
    fetchItems()
  }
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div class="container">
    <h1>BaaS Vue + Supabase</h1>

    <div class="add-form">
      <input v-model="newItemName" placeholder="Nazwa elementu" />
      <input v-model="newItemDesc" placeholder="Opis" />
      <button @click="addItem">Dodaj</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nazwa</th>
          <th>Opis</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <template v-if="editingId !== item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.description }}</td>
            <td>
              <button @click="startEdit(item)">Edytuj</button>
              <button @click="deleteItem(item.id)" class="danger">Usuń</button>
            </td>
          </template>

          <template v-else>
            <td>{{ item.id }}</td>
            <td><input v-model="editName" /></td>
            <td><input v-model="editDesc" /></td>
            <td>
              <button @click="saveEdit" class="success">Zapisz</button>
              <button @click="cancelEdit">Anuluj</button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}
.add-form {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
}
button.danger { background-color: #dc3545; }
button.success { background-color: #28a745; }
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}
th { background-color: #f4f4f4; }
</style>