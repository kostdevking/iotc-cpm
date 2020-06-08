import React, { useContext, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, Image, SwitchComponent } from 'react-native';
import { Name, Headline, Detail } from './typography';
import { Switch, Modal, IconButton, Divider } from 'react-native-paper';
import { ReactDispatch, ChartUpdateCallback, DrawerProperty } from '../types';
import { ConfigContext } from '../contexts/config';
import { ScrollView } from 'react-native-gesture-handler';
import { AppleHealthManager } from '../health/appleHealth';
import { GoogleFitManager } from '../health/googleFit';
import { IHealthItem, isHealthService } from '../models';
import { useNavigation } from '@react-navigation/native';

interface DrawerProps {
    sourceSide: 'left' | 'right',
    close(): void
}


export default function InsightDrawer(props: DrawerProps) {
    const { state, dispatch } = useContext(ConfigContext);
    const switchRefs = useRef<React.Component<{ refId: string, onValueChange: Function, value: boolean }>[]>([]);
    const alignSelf = props.sourceSide === 'left' ? 'flex-start' : 'flex-end';
    let icon: any = 'bluetooth';

    /**
     * Enable defaults for the items by simulating switch toggle.
     * since we're storing the refs in array, items gets appended. cleaning the array with the latest refs only
     */
    useEffect(() => {
        if (state.device && state.device.items && switchRefs.current.length > 0) {
            switchRefs.current = switchRefs.current.slice(Math.max(switchRefs.current.length - state.device.items.length, 1));
        }
        switchRefs.current.forEach(switchEl => {
            if (switchEl.props) {
                const serviceId = (switchEl.props.refId as string).split('/')[0];
                if (isHealthService(serviceId) && switchEl.props.onValueChange) {
                    switchEl.props.onValueChange(true);
                }
            }
        });
    }, [state.device, state.device?.items])

    if (state.healthManager) {
        if (state.healthManager instanceof AppleHealthManager) {
            icon = ({ size }: { size: number }) => (
                <Image
                    source={require('../assets/health_kit.png')}
                    style={{ width: 60, height: 60 }}
                />
            );
        }
        else if (state.healthManager instanceof GoogleFitManager) {
            icon = ({ size }: { size: number }) => (
                <Image
                    source={require('../assets/google_fit.png')}
                    style={{ width: size, height: size - 5 }}
                />
            );
        }
    }

    if (!state.device || !state.device.items || !state.insightUpdate) {
        return (null);
    }
    return (
        <SafeAreaView style={style.container}>
            <View style={style.header}>
                <IconButton icon={icon} size={30} style={{ marginLeft: -5, marginRight: 20 }} />
                <View style={{ width: '60%', paddingBottom: 100 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Headline>Sync options</Headline>
                        <IconButton onPress={() => {
                           props.close()
                        }} icon='chevron-left' style={{ marginLeft: 40, marginTop: -5 }} />
                    </View>
                    <Detail>Which kind of device data would you like to show?</Detail>
                </View>
            </View>
            <Name style={{ marginBottom: 20 }}>{state.device.name}</Name>
            <Divider />
            <ScrollView>
                {state.device.items.map((item, index) => (
                    <View style={style.itemContainer} key={`view-${item.id}`}>
                        <Name>{item.name}</Name>

                        {/* pass extra parameter to the ref in order to process and enable only valid ids */}
                        <Switch {...{ refId: `${item.parentId}/${item.id}` }} ref={element => (switchRefs.current = [...switchRefs.current, element as any])} value={item.enabled} onValueChange={async (current) => {
                            await item.enable(current, (itemId, value, itemName) => {
                                (state.insightUpdate as ChartUpdateCallback)({
                                    itemId,
                                    itemName,
                                    value
                                });
                            });
                            // dispatch is needed to update state of device items
                            dispatch({
                                type: 'REGISTER',
                                payload: state.device
                            });
                        }} />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>)
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        marginLeft: 20
    },
    header: {
        marginTop: 30,
        flexDirection: 'row'
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20
    }
});