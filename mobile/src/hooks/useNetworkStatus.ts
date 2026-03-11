/**
 * Network Status Hook
 * Monitor network connectivity and provide online/offline state
 */
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
}

export const useNetworkStatus = () => {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: null,
        type: 'unknown',
    });

    useEffect(() => {
        // Get initial state
        NetInfo.fetch().then((state: NetInfoState) => {
            setNetworkStatus({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            });
        });

        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setNetworkStatus({
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return networkStatus;
};
