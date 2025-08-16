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
    TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SwipeListView } from 'react-native-swipe-list-view';
import Toast from 'react-native-toast-message';

export interface DataModel {
    id: string;
    name: string;
    value: string;
};

const App = () => {
    const [items, setItems] = useState<DataModel[]>([]);
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

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

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Kopyalandı!');
    };

    const handleClearAll = () => {
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
            visibilityTime: 600,
            autoHide: true,
            topOffset: 0,
            bottomOffset: 50,
        });
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
                                {items.length > 0 && (
                                    <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
                                        <Text style={styles.clearAllText}>Tümünü Sil</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

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
                                        onPress={() => showToast(`${item.name} tıklandı!`)}
                                    >
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
                                rightOpenValue={-150}
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
            <Toast />
        </>
    );
};

export default App;

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