export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  HomeAluno: undefined;
  MinhasReservas: undefined;
  SolicitarReserva: undefined;
  PerfilAluno: undefined;
  DetalheReserva: { reserva?: any };
  QRCodeReserva: { reservaId: string };
  EditarPerfilAluno: undefined;
  RecuperarSenhaAluno: undefined;
  // Adicione outras rotas conforme necessário
};
