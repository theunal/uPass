import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeListView } from 'react-native-swipe-list-view';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export interface DataModel {
  id: string;
  name: string;
  value: string;
};

const UPass = ({ change_password }: any) => {
  const [items, setItems] = useState<DataModel[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await AsyncStorage.getItem('my_items');
    if (data) {
      setItems(JSON.parse(data));
    }
  };

  const saveToStorage = async (newItems: DataModel[]) => {
    setItems(newItems);
    await AsyncStorage.setItem('my_items', JSON.stringify(newItems));
  };

  const handleAddOrUpdate = async () => {
    if (!name || !value) return Alert.alert('Lütfen tüm alanları doldurun.');

    if (editingId) {
      // Güncelleme
      const updatedItems = items.map(item =>
        item.id === editingId ? { ...item, name, value } : item
      );
      await saveToStorage(updatedItems);
      setEditingId(null);
    } else {
      // Yeni ekleme
      const newItem: DataModel = {
        id: Date.now().toString(),
        name,
        value,
      };
      await saveToStorage([...items, newItem]);
    }

    setName('');
    setValue('');
    bottomSheetRef.current?.close();
  };

  const handleDelete = async (id: string) => {
    const filtered = items.filter(item => item.id !== id);
    await saveToStorage(filtered);
  };

  const handleEdit = (item: DataModel) => {
    setName(item.name);
    setValue(item.value);
    setEditingId(item.id);
    bottomSheetRef.current?.expand();
  };

  const handleClearAll = () => {
    setMenuVisible(false);
    Alert.alert(
      'Tümünü sil',
      'Tüm kayıtları silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await saveToStorage([]);
          },
        },
      ]
    );
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'bottom',
      visibilityTime: 1000,
      autoHide: true,
      topOffset: 0,
      bottomOffset: 50,
    });
  };

  const downloadItemsJson = async () => {
    try {
      // 1. JSON stringe çevir
      const json = JSON.stringify(items, null, 2);

      // 2. Dosya yolu oluştur
      const fileUri = FileSystem.cacheDirectory + 'uPass.json';

      // 3. Dosyayı kaydet
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      // 4. Dosyayı paylaş / indir
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'uPass JSON File',
          UTI: 'public.json',
        });
      } else {
        showToast('Paylaşım mevcut değil!');
      }
    } catch (error) {
      showToast('JSON download hatası:' + error);
    }
  };

  const importJson = async () => {
    try {
      // 1. Dosya seç
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: 'application/json',
      });

      // Kullanıcı iptal ettiyse
      if (res.canceled) return;

      // assets array’inden dosya uri al
      const successResult = res as DocumentPicker.DocumentPickerSuccessResult;
      if (!successResult.assets || successResult.assets.length === 0) {
        alert('Dosya seçilemedi!');
        return;
      }

      const fileUri = successResult.assets[0].uri;

      // Dosyayı oku
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let data: DataModel[] = JSON.parse(content);

      if (!Array.isArray(data)) {
        showToast('Geçersiz JSON formatı!');
        return;
      }

      // State ve AsyncStorage güncelle
      const existingIds = new Set(items.map(item => item.id));
      const newData = data.filter(item => !existingIds.has(item.id));
      const mergedData = [...items, ...newData];

      setItems(mergedData);
      await AsyncStorage.setItem('my_items', JSON.stringify(mergedData));

      showToast('JSON başarıyla içe aktarıldı ✅');
    }
    catch (error) {
      showToast('Dosya içe aktarılamadı! ' + error);
    }
  };

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <SafeAreaView style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerText}>uPass</Text>

                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ position: 'absolute', right: 20 }}>
                  <Text style={{ fontSize: 24, color: '#fff' }}>

                    <Svg width={24} height={24} viewBox="0 0 640 640" fill="white">
                      <Path d="M320 208C289.1 208 264 182.9 264 152C264 121.1 289.1 96 320 96C350.9 96 376 121.1 376 152C376 182.9 350.9 208 320 208zM320 432C350.9 432 376 457.1 376 488C376 518.9 350.9 544 320 544C289.1 544 264 518.9 264 488C264 457.1 289.1 432 320 432zM376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320z" />
                    </Svg>

                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dropdown Menu */}
              <Modal
                transparent
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setMenuVisible(false)}
                >
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity onPress={handleClearAll} style={styles.dropdownItem}>
                      <Text style={styles.dropdownText}>Tümünü Sil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={change_password} style={styles.dropdownItem}>
                      <Text style={styles.dropdownText}>Parolayı Değiştir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={downloadItemsJson} style={styles.dropdownItem}>
                      <Text style={styles.dropdownText}>
                        Dışarı Aktar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={importJson} style={styles.dropdownItem}>
                      <Text style={styles.dropdownText}>
                        İçeri Aktar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>

              {/* Search */}
              <TextInput
                placeholder="Ara..."
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />

              {/* List */}
              <SwipeListView
                data={filteredItems}
                keyExtractor={(item: DataModel) => item.id}
                renderItem={({ item }: { item: DataModel }) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={1}
                    onPress={async () => {
                      await Clipboard.setStringAsync(item.value);
                      showToast(`${item.name} kopyalandı!`);
                    }}>

                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.value}>****</Text>
                  </TouchableOpacity>
                )}
                renderHiddenItem={({ item }: { item: DataModel }) => (
                  <View
                    key={item.id}
                    style={styles.rowBack}
                  >
                    <TouchableOpacity
                      style={[styles.backBtn, styles.editBtn]}
                      onPress={() => handleEdit(item)}
                    >
                      <Text style={styles.backText}>Güncelle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.backBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Text style={styles.backText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                )}
                rightOpenValue={-162}
                disableRightSwipe
                previewRowKey={'0'}
                previewOpenValue={-40}
                previewOpenDelay={3000}
              />

              {/* Floating + Button */}
              <TouchableOpacity
                style={styles.fab}
                onPress={() => bottomSheetRef.current?.expand()}
              >
                <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>

              {/* BottomSheet */}
              <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={['35%']}
                enablePanDownToClose={true}
                onClose={() => {
                  setName('');
                  setValue('');
                  setEditingId(null);
                }}
              >
                <BottomSheetView style={styles.bottomSheetContainer}>
                  <Text style={styles.sheetTitle}>
                    {editingId ? 'Parolayı Güncelle' : 'Yeni Parola Ekle'}
                  </Text>

                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Anahtar"
                      placeholderTextColor="#4AB1D7"
                      value={name}
                      onChangeText={setName}
                      style={styles.inputModern}
                    />

                    <TextInput
                      placeholder="Parola"
                      placeholderTextColor="#4AB1D7"
                      value={value}
                      onChangeText={setValue}
                      style={styles.inputModern}
                      secureTextEntry={!editingId}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtnModern}
                    activeOpacity={0.8}
                    onPress={handleAddOrUpdate}
                  >
                    <Text style={styles.saveTextModern}>
                      {editingId ? 'Güncelle' : 'Kaydet'}
                    </Text>
                  </TouchableOpacity>
                </BottomSheetView>
              </BottomSheet>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </GestureHandlerRootView>
      {/* <Toast /> */}
    </>
  );
};

export default UPass;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4AB1D7',
    borderRadius: 10,
    margin: 10,
  },
  headerText: { fontSize: 26, fontWeight: 'bold', color: '#fff' },

  headerActions: {
    position: "absolute",
    right: 15,
    flexDirection: "column", // alt alta
    alignItems: "flex-end",
  },
  actionBtn: {
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 15,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 150,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },


  clearAllBtn: { position: 'absolute', right: 15 },
  clearAllText: { color: '#fff', fontWeight: 'bold' },
  searchInput: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  value: { fontSize: 16, color: '#555', marginTop: 5 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4AB1D7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#4AB1D7', fontWeight: 'bold', fontSize: 16 },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 15,
    marginVertical: 5,
  },
  backBtn: {
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 5,
  },
  editBtn: { backgroundColor: '#FFD700' },
  deleteBtn: { backgroundColor: '#FF4D4D' },
  backText: { color: '#fff', fontWeight: 'bold' },

  bottomSheetContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fc', // Açık renk arka plan
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4AB1D7',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 15, // Modern boşluk
    marginBottom: 20,
  },
  inputModern: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2, // Android gölge
  },
  saveBtnModern: {
    backgroundColor: '#4AB1D7',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4AB1D7',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveTextModern: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});