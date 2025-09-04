import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../theme/colors';

interface Reserva {
  id: string;
  data: string;
  vaiIda: boolean;
  vaiVolta: boolean;
  status: string;
  ativo: boolean;
  createdAt: string;
}

export default function MinhasReservas() {
  const navigation = useNavigation();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  
  // Estados para criar reserva avulsa
  const [novaData, setNovaData] = useState('');
  const [novaVaiIda, setNovaVaiIda] = useState(true);
  const [novaVaiVolta, setNovaVaiVolta] = useState(true);
  
  // Estados para editar reserva
  const [editVaiIda, setEditVaiIda] = useState(true);
  const [editVaiVolta, setEditVaiVolta] = useState(true);

  useEffect(() => {
    carregarReservas();
  }, []);

  const carregarReservas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservas-automaticas/minhas');
      setReservas(response.data);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const criarReservaAvulsa = async () => {
    if (!novaData) {
      Alert.alert('Erro', 'Por favor, informe a data da viagem');
      return;
    }

    try {
      await api.post('/reservas/avulsa', {
        data: novaData,
        vaiIda: novaVaiIda,
        vaiVolta: novaVaiVolta
      });
      
      Alert.alert('Sucesso', 'Reserva avulsa criada com sucesso!');
      setModalVisible(false);
      setNovaData('');
      setNovaVaiIda(true);
      setNovaVaiVolta(true);
      carregarReservas();
    } catch (error: any) {
      console.error('Erro ao criar reserva avulsa:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível criar a reserva');
    }
  };

  const editarReserva = async () => {
    if (!selectedReserva) return;

    try {
      await api.put(`/reservas/${selectedReserva.id}/editar`, {
        vaiIda: editVaiIda,
        vaiVolta: editVaiVolta
      });
      
      Alert.alert('Sucesso', 'Reserva atualizada com sucesso!');
      setEditModalVisible(false);
      setSelectedReserva(null);
      carregarReservas();
    } catch (error: any) {
      console.error('Erro ao editar reserva:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível editar a reserva');
    }
  };

  const cancelarReserva = async (reservaId: string) => {
    Alert.alert(
      'Cancelar Viagem',
      'Tem certeza que deseja cancelar esta viagem?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/reservas/${reservaId}/cancelar`);
              Alert.alert('Sucesso', 'Viagem cancelada com sucesso');
              carregarReservas();
            } catch (error) {
              console.error('Erro ao cancelar reserva:', error);
              Alert.alert('Erro', 'Não foi possível cancelar a viagem');
            }
          },
        },
      ]
    );
  };

  const abrirModalEdicao = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setEditVaiIda(reserva.vaiIda);
    setEditVaiVolta(reserva.vaiVolta);
    setEditModalVisible(true);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const hoje = new Date();
    
    // Remover as horas para comparação apenas da data
    const dataComparacao = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const hojeComparacao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const diffTime = dataComparacao.getTime() - hojeComparacao.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  };

  const formatarDataInput = () => {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA': return colors.success;
      case 'EMBARCADO': return colors.info;
      case 'DESEMBARCADO': return colors.textSecondary;
      case 'CANCELADA': return colors.error;
      default: return colors.warning;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'Confirmada';
      case 'EMBARCADO': return 'Embarcado';
      case 'DESEMBARCADO': return 'Concluída';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  const reservasFuturas = reservas.filter(r => {
    const dataReserva = new Date(r.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataReserva >= hoje && r.ativo;
  });

  const reservasPassadas = reservas.filter(r => {
    const dataReserva = new Date(r.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataReserva < hoje || !r.ativo;
  });

  const onRefresh = () => {
    setRefreshing(true);
    carregarReservas();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
        <MaterialIcons name="directions-bus" size={28} color={colors.primary} />
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
      </View>

      <Text style={styles.subtitle}>
        Gerencie todas as suas viagens em um só lugar. Configure seus horários recorrentes 
        e solicite viagens avulsas quando necessário.
      </Text>        {/* Botões de ação */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Viagem Avulsa</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => (navigation as any).navigate('MeusHorarios')}
          >
            <MaterialIcons name="schedule" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Configurar Horários</Text>
          </TouchableOpacity>
        </View>

        {/* Próximas Viagens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Viagens</Text>
          {reservasFuturas.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma viagem programada</Text>
            </View>
          ) : (
            reservasFuturas.map((reserva) => (
              <View key={reserva.id} style={styles.reservaCard}>
                <View style={styles.reservaHeader}>
                  <Text style={styles.reservaData}>{formatarData(reserva.data)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reserva.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(reserva.status)}</Text>
                  </View>
                </View>

                <View style={styles.viagemInfo}>
                  <View style={styles.viagemItem}>
                    <MaterialIcons 
                      name={reserva.vaiIda ? "check-circle" : "cancel"} 
                      size={20} 
                      color={reserva.vaiIda ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.viagemText}>Ida</Text>
                  </View>
                  <View style={styles.viagemItem}>
                    <MaterialIcons 
                      name={reserva.vaiVolta ? "check-circle" : "cancel"} 
                      size={20} 
                      color={reserva.vaiVolta ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.viagemText}>Volta</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {reserva.status === 'APROVADA' && (
                    <>
                      <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => (navigation as any).navigate('DetalheReserva', { reservaId: reserva.id })}
                      >
                        <MaterialIcons name="visibility" size={18} color={colors.primary} />
                        <Text style={styles.detailButtonText}>Detalhes</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => (navigation as any).navigate('QRCodeReserva', { reservaId: reserva.id })}
                      >
                        <MaterialIcons name="qr-code" size={18} color={colors.success} />
                        <Text style={styles.qrButtonText}>QR Code</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancelarReserva(reserva.id)}
                      >
                        <MaterialIcons name="cancel" size={18} color={colors.error} />
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {(reserva.status === 'CANCELADA' || reserva.status === 'PENDENTE') && (
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() => (navigation as any).navigate('DetalheReserva', { reservaId: reserva.id })}
                    >
                      <MaterialIcons name="visibility" size={18} color={colors.primary} />
                      <Text style={styles.detailButtonText}>Detalhes</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Histórico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {reservasPassadas.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma viagem no histórico</Text>
            </View>
          ) : (
            reservasPassadas.slice(0, 10).map((reserva) => (
              <View key={reserva.id} style={[styles.reservaCard, styles.historicCard]}>
                <View style={styles.reservaHeader}>
                  <Text style={styles.reservaData}>{formatarData(reserva.data)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reserva.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(reserva.status)}</Text>
                  </View>
                </View>

                <View style={styles.viagemInfo}>
                  <View style={styles.viagemItem}>
                    <MaterialIcons 
                      name={reserva.vaiIda ? "check-circle" : "cancel"} 
                      size={20} 
                      color={reserva.vaiIda ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.viagemText}>Ida</Text>
                  </View>
                  <View style={styles.viagemItem}>
                    <MaterialIcons 
                      name={reserva.vaiVolta ? "check-circle" : "cancel"} 
                      size={20} 
                      color={reserva.vaiVolta ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.viagemText}>Volta</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal para criar reserva avulsa */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Viagem Avulsa</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data da viagem:</Text>
              <TextInput
                style={styles.dateInput}
                value={novaData}
                onChangeText={setNovaData}
                placeholder={formatarDataInput()}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.helpText}>Formato: AAAA-MM-DD (ex: 2025-08-15)</Text>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Ida</Text>
                <Switch
                  value={novaVaiIda}
                  onValueChange={setNovaVaiIda}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
              
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Volta</Text>
                <Switch
                  value={novaVaiVolta}
                  onValueChange={setNovaVaiVolta}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={criarReservaAvulsa}
              >
                <Text style={styles.modalConfirmText}>Solicitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar reserva */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Viagem</Text>
            
            <Text style={styles.modalSubtitle}>
              {selectedReserva && formatarData(selectedReserva.data)}
            </Text>

            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Ida</Text>
                <Switch
                  value={editVaiIda}
                  onValueChange={setEditVaiIda}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
              
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Volta</Text>
                <Switch
                  value={editVaiVolta}
                  onValueChange={setEditVaiVolta}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={editarReserva}
              >
                <Text style={styles.modalConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
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
  historicCard: {
    opacity: 0.8,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservaData: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viagemInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  viagemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viagemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  detailButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Estilos dos modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  switchItem: {
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
