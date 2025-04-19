import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList, Image,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    SafeAreaView,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';

export interface DataModel {
    name: string;
    value: string;
};

const App = () => {
    const [items, setItems] = useState<DataModel[]>([]);
    const [filtered_items, set_filtered_items] = useState<DataModel[]>([]);
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');
    const bottomSheetRef = useRef<BottomSheet>(null);

    const loadData = async () => {
        const data = await AsyncStorage.getItem('my_items');
        if (data) {
            const json_data = JSON.parse(data);
            setItems(json_data);
            set_filtered_items(json_data);
        };

        // let fake_items: DataModel[] = [];
        // for (let i = 0; i < 500; i++) {
        //     fake_items.push({
        //         name: `${i + 1}. ${generateRandomName()}`,
        //         value: generateRandomValue()
        //     });
        // };
        // setItems(fake_items)
        // await AsyncStorage.setItem('my_items', JSON.stringify(fake_items));
    };

    const generateRandomName = () => {
        const names = ['Facebook', 'Instagram', 'Twitter', 'Gmail', 'LinkedIn', 'Github', 'Netflix', 'Amazon', 'Reddit'];
        const randomIndex = Math.floor(Math.random() * names.length);
        return names[randomIndex];
    };

    const generateRandomValue = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const saveItem = async () => {
        if (!name || !value) return Alert.alert('Lütfen tüm alanları doldurun.');
        const newItem = { name, value };
        const newItems = [...items, newItem];
        await AsyncStorage.setItem('my_items', JSON.stringify(newItems));
        setItems(newItems);
        setName('');
        setValue('');
        bottomSheetRef.current?.close();
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <GestureHandlerRootView style={{
            flex: 1,
        }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <SafeAreaView style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerText}>
                                uPass
                            </Text>
                            <TouchableOpacity onPress={() => { }} style={{
                                marginLeft: 'auto',
                                marginRight: 5
                            }}>
                                <Svg viewBox="0 0 512 512" style={{
                                    width: 20,
                                    height: 20
                                }}>
                                    <Path fill="#ffffff" d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" /></Svg>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <TextInput
                                placeholder="Ara..."
                                placeholderTextColor="#aaa"
                                value={search}
                                onChangeText={(search: string) => {
                                    setSearch(search);
                                    const filtered = items.filter(item =>
                                        item.name.toLowerCase().includes(search.toLowerCase()));
                                    set_filtered_items(filtered);
                                }}
                                style={styles.searchInput}
                            />
                        </View>

                        <FlatList
                            data={filtered_items}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => copyToClipboard(item.value)}
                                    style={styles.card}
                                >
                                    <Text style={styles.title}>{item.name}</Text>
                                    <Text style={styles.value}>****</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity style={styles.fab}
                            onPress={() => {
                                bottomSheetRef.current?.expand()
                            }}
                        >
                            <Text style={styles.fabText}>
                                +
                            </Text>
                        </TouchableOpacity>

                        <BottomSheet
                            backgroundStyle={{
                                backgroundColor: '#4AB1D7'
                            }}
                            index={-1}
                            onClose={() => {
                                setName('');
                                setValue('');
                            }}
                            ref={bottomSheetRef}
                            snapPoints={['25%']}
                            enablePanDownToClose={true}
                        >
                            <BottomSheetView style={{
                                flex: 1,
                                padding: 10,
                                paddingTop: 0
                            }}>
                                <TextInput
                                    placeholder="Name"
                                    placeholderTextColor="#4AB1D7"
                                    value={name}
                                    onChangeText={setName}
                                    style={styles.input}
                                />

                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="#4AB1D7"
                                    value={value}
                                    onChangeText={setValue}
                                    style={styles.input}
                                />

                                <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                                    <Text style={styles.saveText}>Kaydet</Text>
                                </TouchableOpacity>
                            </BottomSheetView>
                        </BottomSheet>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
};

export default App;

const copyToClipboard = (text: string) => {
    Clipboard.setStringAsync(text);
    // if (Platform.OS === 'android') {
    //     // ToastAndroid.show('Kopyalandı', ToastAndroid.SHORT);
    // } else {

    // }
};

const styles = StyleSheet.create({
    searchContainer: {
        position: 'fixed',
        marginTop: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
    },
    contentContainer: {
        flex: 1,
        padding: 36,
        alignItems: 'center',
    },
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        borderRadius: 5,
        padding: 5,
        backgroundColor: '#4AB1D7',
    },
    headerText: {
        marginLeft: 5,
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    card: {
        padding: 5,
        backgroundColor: '#eee',
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 8,
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    value: { fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 50,
        height: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4AB1D7',
        borderRadius: 100
    },
    fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 3 },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000066',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    input: {
        width: '100%',           // <-- Tüm genişlik
        backgroundColor: 'white',// <-- Beyaz arka plan
        borderWidth: 1,
        borderColor: '#ccc',
        marginVertical: 10,
        borderRadius: 8,
        padding: 10,
    },
    saveBtn: {
        marginTop: 10,
        width: 100,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveText: { color: '#4AB1D7', fontWeight: 'bold' },
});