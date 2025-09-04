import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { colors } from '../theme/colors';

interface SolicitacaoAvulsa {
  id: number;
  data: string;
  vaiIda: boolean;
  vaiVolta: boolean;
  motivo: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
  createdAt: string;
}

export default function SolicitacaoReservaAvulsa({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAvulsa[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados do formulário
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaiIda, setVaiIda] = useState(true);
  const [vaiVolta, setVaiVolta] = useState(true);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    loadSolicitacoes();
  }, []);

  const loadSolicitacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alunos/solicitacoes-avulsas');
      setSolicitacoes(response.data.solicitacoes || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarSolicitacao = async () => {
    if (!motivo.trim()) {
      Alert.alert('Erro', 'Por favor, informe o motivo da solicitação');
      return;
    }

    if (!vaiIda && !vaiVolta) {
      Alert.alert('Erro', 'Selecione pelo menos ida ou volta');
      return;
    }

    try {
      setLoading(true);
      
      await api.post('/alunos/solicitar-reserva-avulsa', {
        data: dataSelecionada.toISOString(),
        vaiIda,
        vaiVolta,
        motivo: motivo.trim()
      });

      Alert.alert(
        'Sucesso',
        'Solicitação enviada! Aguarde a aprovação do supervisor.',
        [{ text: 'OK', onPress: () => {
          setModalVisible(false);
          setMotivo('');
          setDataSelecionada(new Date());
          setVaiIda(true);
          setVaiVolta(true);
          loadSolicitacoes();
        }}]
      );
      
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      Alert.alert(
        'Erro', 
        error.response?.data?.error || 'Não foi possível enviar a solicitação'
      );
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDataSelecionada(selectedDate);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return colors.warning;
      case 'APROVADA': return colors.success;
      case 'REJEITADA': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Aguardando';
      case 'APROVADA': return 'Aprovada';
      case 'REJEITADA': return 'Rejeitada';
      default: return status;
    }
  };

  const renderSolicitacao = (item: SolicitacaoAvulsa) => (
    <View key={item.id} style={styles.solicitacaoCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dataText}>{formatDate(item.data)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.viagemInfo}>
        {item.vaiIda && (
          <View style={styles.viagemTag}>
            <MaterialIcons name="flight-takeoff" size={16} color={colors.primary} />
            <Text style={styles.viagemTagText}>Ida</Text>
          </View>
        )}
        {item.vaiVolta && (
          <View style={styles.viagemTag}>
            <MaterialIcons name="flight-land" size={16} color={colors.primary} />
            <Text style={styles.viagemTagText}>Volta</Text>
          </View>
        )}
      </View>

      <Text style={styles.motivoLabel}>Motivo:</Text>
      <Text style={styles.motivoText}>{item.motivo}</Text>

      <Text style={styles.dataEnvio}>
        Enviado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitações Avulsas</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>
              Solicite uma reserva para um dia específico que não está nos seus horários recorrentes. 
              O supervisor analisará e aprovará ou rejeitará sua solicitação.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.novasolicitacaoButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.novasolicitacaoText}>Nova Solicitação</Text>
        </TouchableOpacity>

        <View style={styles.listaContainer}>
          <Text style={styles.listaTitle}>Suas Solicitações</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : solicitacoes.length > 0 ? (
            solicitacoes.map(renderSolicitacao)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma solicitação encontrada</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para Nova Solicitação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Solicitação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Seleção de Data */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Data da Viagem</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="event" size={20} color={colors.primary} />
                  <Text style={styles.dateButtonText}>
                    {dataSelecionada.toLocaleDateString('pt-BR')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ida e Volta */}
              <View style={styles.switchContainer}>
                <View style={styles.switchItem}>
                  <MaterialIcons name="flight-takeoff" size={20} color={colors.primary} />
                  <Text style={styles.switchLabel}>Ida</Text>
                  <Switch
                    value={vaiIda}
                    onValueChange={setVaiIda}
                    trackColor={{ false: colors.lightGray, true: colors.primary + '44' }}
                    thumbColor={vaiIda ? colors.primary : '#f4f3f4'}
                  />
                </View>

                <View style={styles.switchItem}>
                  <MaterialIcons name="flight-land" size={20} color={colors.primary} />
                  <Text style={styles.switchLabel}>Volta</Text>
                  <Switch
                    value={vaiVolta}
                    onValueChange={setVaiVolta}
                    trackColor={{ false: colors.lightGray, true: colors.primary + '44' }}
                    thumbColor={vaiVolta ? colors.primary : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Motivo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Motivo da Solicitação *</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Ex: Consulta médica, prova de segunda chamada, etc."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Botões */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.enviarButton}
                  onPress={enviarSolicitacao}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#fff" />
                      <Text style={styles.enviarButtonText}>Enviar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={dataSelecionada}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  novasolicitacaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    gap: 8,
  },
  novasolicitacaoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listaContainer: {
    marginBottom: 20,
  },
  listaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  solicitacaoCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataText: {
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
    fontSize: 12,
    fontWeight: '600',
  },
  viagemInfo: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
  viagemTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  motivoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  dataEnvio: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  enviarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  enviarButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
