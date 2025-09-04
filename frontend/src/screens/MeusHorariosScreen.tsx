import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { colors } from '../theme/colors';

interface HorarioRecorrente {
  id: number;
  diaSemana: string;
  vaiIda: boolean;
  vaiVolta: boolean;
  ativo: boolean;
  aprovado: boolean;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

interface SolicitacaoHorario {
  diaSemana: string;
  vaiIda: boolean;
  vaiVolta: boolean;
  motivo: string;
  dataInicio: string;
  dataFim?: string;
}

const DIAS_SEMANA = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

const DIAS_OPCOES = [
  { key: 'SEGUNDA', label: 'Segunda-feira' },
  { key: 'TERCA', label: 'Terça-feira' },
  { key: 'QUARTA', label: 'Quarta-feira' },
  { key: 'QUINTA', label: 'Quinta-feira' },
  { key: 'SEXTA', label: 'Sexta-feira' },
  { key: 'SABADO', label: 'Sábado' },
  { key: 'DOMINGO', label: 'Domingo' },
];

export default function MeusHorariosScreen() {
  const [horarios, setHorarios] = useState<HorarioRecorrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoHorario>({
    diaSemana: 'SEGUNDA',
    vaiIda: true,
    vaiVolta: true,
    motivo: '',
    dataInicio: new Date().toISOString().split('T')[0],
  });
  const navigation = useNavigation();

  useEffect(() => {
    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/horarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHorarios(response.data);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus horários');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarHorarios();
  };

  const removerHorario = (id: number) => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja remover este horário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await api.delete(`/horarios/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Sucesso', 'Horário removido com sucesso');
              carregarHorarios();
            } catch (error) {
              console.error('Erro ao remover horário:', error);
              Alert.alert('Erro', 'Não foi possível remover o horário');
            }
          },
        },
      ]
    );
  };

  const enviarSolicitacao = async () => {
    if (!solicitacao.motivo.trim()) {
      Alert.alert('Erro', 'Por favor, informe o motivo da solicitação');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await api.post('/horarios/solicitar', solicitacao, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Sucesso', 'Solicitação enviada com sucesso!');
      setModalVisible(false);
      setSolicitacao({
        diaSemana: 'SEGUNDA',
        vaiIda: true,
        vaiVolta: true,
        motivo: '',
        dataInicio: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Não foi possível enviar a solicitação'
      );
    }
  };

  const getStatusColor = (horario: HorarioRecorrente) => {
    if (!horario.aprovado) return colors.warning;
    if (!horario.ativo) return colors.error;
    return colors.success;
  };

  const getStatusText = (horario: HorarioRecorrente) => {
    if (!horario.aprovado) return 'Pendente';
    if (!horario.ativo) return 'Inativo';
    return 'Aprovado';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Horários</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando horários...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Horários</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Seus horários recorrentes definem quando você pode usar o transporte.
            Para solicitar novos dias, toque no botão "+" acima.
          </Text>
        </View>

        {horarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="schedule" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>Nenhum horário cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão "+" para solicitar novos horários
            </Text>
          </View>
        ) : (
          horarios.map((horario) => (
            <View key={horario.id} style={styles.horarioCard}>
              <View style={styles.horarioHeader}>
                <Text style={styles.diaSemana}>
                  {DIAS_SEMANA[horario.diaSemana as keyof typeof DIAS_SEMANA]}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(horario) }]}>
                  <Text style={styles.statusText}>{getStatusText(horario)}</Text>
                </View>
              </View>

              <View style={styles.horarioInfo}>
                <View style={styles.viagemInfo}>
                  <MaterialIcons 
                    name="arrow-forward" 
                    size={16} 
                    color={horario.vaiIda ? colors.success : colors.gray} 
                  />
                  <Text style={[styles.viagemText, { color: horario.vaiIda ? colors.dark : colors.gray }]}>
                    Ida
                  </Text>
                </View>
                <View style={styles.viagemInfo}>
                  <MaterialIcons 
                    name="arrow-back" 
                    size={16} 
                    color={horario.vaiVolta ? colors.success : colors.gray} 
                  />
                  <Text style={[styles.viagemText, { color: horario.vaiVolta ? colors.dark : colors.gray }]}>
                    Volta
                  </Text>
                </View>
              </View>

              {horario.observacoes && (
                <View style={styles.observacoes}>
                  <Text style={styles.observacoesText}>{horario.observacoes}</Text>
                </View>
              )}

              {horario.aprovado && (
                <TouchableOpacity
                  onPress={() => removerHorario(horario.id)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                  <Text style={styles.removeButtonText}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para nova solicitação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Novo Horário</Text>

            <Text style={styles.label}>Dia da Semana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasContainer}>
              {DIAS_OPCOES.map((dia) => (
                <TouchableOpacity
                  key={dia.key}
                  style={[
                    styles.diaButton,
                    solicitacao.diaSemana === dia.key && styles.diaButtonSelected,
                  ]}
                  onPress={() => setSolicitacao(prev => ({ ...prev, diaSemana: dia.key }))}
                >
                  <Text style={[
                    styles.diaButtonText,
                    solicitacao.diaSemana === dia.key && styles.diaButtonTextSelected,
                  ]}>
                    {dia.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.switchContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Ida</Text>
                <Switch
                  value={solicitacao.vaiIda}
                  onValueChange={(value) => setSolicitacao(prev => ({ ...prev, vaiIda: value }))}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Volta</Text>
                <Switch
                  value={solicitacao.vaiVolta}
                  onValueChange={(value) => setSolicitacao(prev => ({ ...prev, vaiVolta: value }))}
                  trackColor={{ false: colors.gray, true: colors.primary }}
                />
              </View>
            </View>

            <Text style={styles.label}>Motivo da Solicitação</Text>
            <TextInput
              style={styles.motivoInput}
              placeholder="Ex: Mudança de horário escolar, nova disciplina..."
              value={solicitacao.motivo}
              onChangeText={(text) => setSolicitacao(prev => ({ ...prev, motivo: text }))}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={enviarSolicitacao}
              >
                <Text style={styles.confirmButtonText}>Solicitar</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginRight: 30,
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray,
  },
  infoCard: {
    backgroundColor: colors.lightBlue,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 5,
  },
  horarioCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diaSemana: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  horarioInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  viagemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viagemText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  observacoes: {
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  observacoesText: {
    fontSize: 14,
    color: colors.dark,
    fontStyle: 'italic',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  removeButtonText: {
    marginLeft: 5,
    color: colors.error,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 10,
  },
  diasContainer: {
    marginBottom: 20,
  },
  diaButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 10,
  },
  diaButtonSelected: {
    backgroundColor: colors.primary,
  },
  diaButtonText: {
    fontSize: 14,
    color: colors.dark,
  },
  diaButtonTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
  switchContainer: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.dark,
  },
  motivoInput: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: colors.dark,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
