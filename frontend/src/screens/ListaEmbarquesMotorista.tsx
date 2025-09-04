import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import api from '../services/api';
import { colors } from '../theme/colors';

interface Reserva {
  id: number;
  userId: string;
  status: 'APROVADA' | 'EMBARCADO' | 'DESEMBARCADO';
  data: string;
  vaiIda: boolean;
  vaiVolta: boolean;
  user: {
    nome: string;
    matricula: string;
    fotoPerfilUrl?: string;
  };
}

interface ListaEmbarquesProps {
  navigation: any;
}

export default function ListaEmbarquesMotorista({ navigation }: ListaEmbarquesProps) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadReservasHoje();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadReservasHoje = async () => {
    try {
      setLoading(true);
      const response = await api.get('/motoristas/reservas-hoje');
      setReservas(response.data.reservas || []);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de passageiros');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservasHoje();
    setRefreshing(false);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    try {
      // Fechar scanner
      setShowScanner(false);
      
      // Processar QR Code
      const qrData = JSON.parse(data);
      const { userId, nome, matricula } = qrData;
      
      if (!userId) {
        Alert.alert('QR Code Inválido', 'QR Code não contém informações válidas');
        return;
      }

      // Buscar a reserva do usuário para hoje
      const reservaParaHoje = reservas.find(r => r.userId === userId);
      
      if (!reservaParaHoje) {
        Alert.alert(
          'Aluno não encontrado', 
          `${nome || 'Aluno'} não possui reserva para hoje`
        );
        return;
      }

      // Determinar a próxima ação baseada no status atual
      let proximaAcao: 'IDA' | 'VOLTA' | null = null;
      
      if (reservaParaHoje.status === 'APROVADA' && reservaParaHoje.vaiIda) {
        proximaAcao = 'IDA';
      } else if (reservaParaHoje.status === 'EMBARCADO' && reservaParaHoje.vaiVolta) {
        proximaAcao = 'VOLTA';
      }

      if (!proximaAcao) {
        Alert.alert(
          'Ação não permitida', 
          `${nome} não pode ser processado no momento`
        );
        return;
      }

      // Processar embarque/desembarque
      await processarEmbarque(reservaParaHoje.id, proximaAcao);
      
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      Alert.alert('Erro', 'QR Code inválido ou erro ao processar');
    }
  };

  const processarEmbarque = async (reservaId: number, tipo: 'IDA' | 'VOLTA') => {
    try {
      const novoStatus = tipo === 'IDA' ? 'EMBARCADO' : 'DESEMBARCADO';
      
      await api.post('/motoristas/processar-embarque', {
        reservaId,
        novoStatus,
        tipoViagem: tipo
      });

      // Atualizar lista local
      setReservas(prev => prev.map(reserva => 
        reserva.id === reservaId 
          ? { ...reserva, status: novoStatus }
          : reserva
      ));

      const aluno = reservas.find(r => r.id === reservaId);
      Alert.alert(
        'Sucesso', 
        `${aluno?.user.nome} foi marcado como ${novoStatus.toLowerCase()}`
      );
      
    } catch (error) {
      console.error('Erro ao processar embarque:', error);
      Alert.alert('Erro', 'Não foi possível processar o embarque');
    }
  };

  const abrirScanner = () => {
    if (hasPermission === false) {
      Alert.alert('Erro', 'Permissão de câmera negada');
      return;
    }
    setShowScanner(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA': return colors.warning;
      case 'EMBARCADO': return colors.primary;
      case 'DESEMBARCADO': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'Aguardando';
      case 'EMBARCADO': return 'Embarcado';
      case 'DESEMBARCADO': return 'Desembarcado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'schedule';
      case 'EMBARCADO': return 'directions-bus';
      case 'DESEMBARCADO': return 'check-circle';
      default: return 'help';
    }
  };

  const renderReserva = ({ item }: { item: Reserva }) => (
    <View style={styles.reservaCard}>
      <View style={styles.alunoInfo}>
        {item.user.fotoPerfilUrl ? (
          <Image source={{ uri: item.user.fotoPerfilUrl }} style={styles.fotoAluno} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <MaterialIcons name="person" size={24} color={colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.dadosAluno}>
          <Text style={styles.nomeAluno}>{item.user.nome}</Text>
          <Text style={styles.matriculaAluno}>Mat: {item.user.matricula}</Text>
          
          <View style={styles.viagemInfo}>
            {item.vaiIda && (
              <View style={styles.viagemTag}>
                <MaterialIcons name="flight-takeoff" size={16} color={colors.primary} />
                <Text style={styles.viagemText}>Ida</Text>
              </View>
            )}
            {item.vaiVolta && (
              <View style={styles.viagemTag}>
                <MaterialIcons name="flight-land" size={16} color={colors.primary} />
                <Text style={styles.viagemText}>Volta</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
          <MaterialIcons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>

        {item.status === 'APROVADA' && item.vaiIda && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => processarEmbarque(item.id, 'IDA')}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Embarcar</Text>
          </TouchableOpacity>
        )}

        {item.status === 'EMBARCADO' && item.vaiVolta && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => processarEmbarque(item.id, 'VOLTA')}
          >
            <MaterialIcons name="logout" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Desembarcar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando lista de passageiros...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lista de Passageiros</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{reservas.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reservas.filter(r => r.status === 'EMBARCADO').length}
            </Text>
            <Text style={styles.statLabel}>Embarcados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reservas.filter(r => r.status === 'DESEMBARCADO').length}
            </Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.scannerButtons}>
        <TouchableOpacity 
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => abrirScanner()}
        >
          <FontAwesome5 name="qrcode" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Escanear QR Code</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reservas}
        renderItem={renderReserva}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal do Scanner */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>
              Escaneando QR Code
            </Text>
          </View>
          
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
          />
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstructions}>
              Posicione o QR Code dentro do quadrado
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scannerButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reservaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alunoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fotoAluno: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  fotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dadosAluno: {
    flex: 1,
  },
  nomeAluno: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  matriculaAluno: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  viagemInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  viagemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viagemText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scannerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginRight: 28,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
