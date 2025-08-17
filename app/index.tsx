import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import UPass from "./uPass";

export default function App() {
    const [password, setPassword] = useState<string | null>(null);
    const [entered, setEntered] = useState("");
    const [mode, setMode] = useState<"create" | "login" | "home" | "change">("login");

    useEffect(() => {
        const loadPassword = async () => {
            const stored = await AsyncStorage.getItem("appPassword");
            if (!stored) {
                setMode("create"); // parola yoksa yeni oluştur
            } else {
                setPassword(stored);
                setMode("login"); // varsa giriş
            }
        };
        loadPassword();
    }, []);

    const handleNumberPress = (num: string) => {
        const _entered = (entered + num).slice(0, 4);
        setEntered(_entered);

        if (_entered.length === 4)
            handleConfirm(_entered);
    };

    const handleBackspace = () => {
        setEntered(entered.slice(0, -1));
    };

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

    const set_new_password = async () => {
        if (entered.length < 4) {
            showToast("Parola 4 haneli olmalı");
            return;
        }
        await AsyncStorage.setItem("appPassword", entered);
        setPassword(entered);
        setEntered("");
        setMode("home");
    };

    const change_password = () => {
        setMode("change");
    };

    const handleConfirm = async (_entered: string | undefined = undefined) => {
        if (mode === "create") {
            await set_new_password();
        } else if (mode === "login") {
            _entered = _entered ?? entered;
            if (_entered.length !== 4) return;

            if (_entered === password) {
                setEntered("");
                setMode("home");
            } else {
                showToast("Yanlış parola");
                setEntered("");
            }
        } else if (mode === "change") {
            await set_new_password();
            showToast("Parola değiştirildi");
        }
    };

    const renderCircles = () => {
        const max = 4;
        let circles = [];
        for (let i = 0; i < max; i++) {
            circles.push(
                <View
                    key={i}
                    style={[styles.circle, entered.length > i && styles.filled]}
                />
            );
        }
        return <View style={styles.circleRow}>{circles}</View>;
    };

    const renderKeypad = () => {
        const numbers = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "⌫"]];
        return (
            <View style={styles.keypad}>
                {numbers.map((row, i) => (
                    <View key={i} style={styles.keypadRow}>
                        {row.map((num, j) => (
                            <TouchableOpacity
                                key={j}
                                style={styles.key}
                                onPress={() =>
                                    num === "⌫" ? handleBackspace() : num !== "" ? handleNumberPress(num) : null
                                }
                            >
                                <Text style={styles.keyText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Text>
                    {entered.toString()}
                </Text>

                {
                    mode === 'change' &&
                    <>
                        <TouchableOpacity style={[
                            styles.confirmBtn,
                            {
                                opacity: entered.length < 4 ? 0.2 : 1
                            }
                        ]} onPress={() => handleConfirm()} disabled={entered.length < 4} >
                            <Text style={styles.confirmText}>
                                Onayla
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[
                            styles.confirmBtn,
                            {
                                backgroundColor: 'white',
                                borderWidth: 2,
                                borderColor: 'black'
                            }
                        ]} onPress={() => {
                            setMode('home');
                        }}>
                            <Text style={[
                                styles.confirmText,
                                {
                                    color: 'black'
                                }
                            ]}>
                                Kapat
                            </Text>
                        </TouchableOpacity>
                    </>
                }
            </View>
        );
    };

    return (
        <>
            {
                mode === "home" ?
                    <UPass change_password={change_password} /> :
                    <>
                        <View style={styles.container}>
                            {mode === "create" && <Text style={styles.title}>Yeni Parola Oluştur</Text>}
                            {mode === "login" && <Text style={styles.title}>Parolanızı Girin</Text>}
                            {mode === "change" && <Text style={styles.title}>Yeni Parola Gir</Text>}
                            {(mode === "create" || mode === "login" || mode === "change") && (
                                <>
                                    {renderCircles()}
                                    {renderKeypad()}
                                </>
                            )}
                        </View>
                    </>
            }
            <Toast />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    title: { fontSize: 20, marginBottom: 20 },
    circleRow: { flexDirection: "row", marginBottom: 20 },
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#333",
        margin: 5,
    },
    filled: { backgroundColor: "#333" },
    keypad: { marginTop: 20 },
    keypadRow: { flexDirection: "row", justifyContent: "center" },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
        margin: 10,
    },
    keyText: { fontSize: 24, fontWeight: "bold" },
    confirmBtn: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#333",
        borderRadius: 10,
        alignItems: "center",
    },
    confirmText: { color: "#fff", fontSize: 18 },
});