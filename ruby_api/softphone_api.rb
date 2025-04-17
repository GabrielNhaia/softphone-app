# softphone_api.rb
require 'sinatra'
require 'json'
require 'sinatra/cors'
require 'dotenv/load'

# Configurar CORS para permitir a comunicação entre o frontend e a API
register Sinatra::Cors
set :allow_origin, "*"
set :allow_methods, "GET, POST, OPTIONS"
set :allow_headers, "Content-Type, Authorization"

# Informações das chamadas (simulado - em produção você usaria um banco de dados ou Redis)
$calls = {}
$active_connections = {}

# Configurações do Asterisk (carregadas de variáveis de ambiente)
ASTERISK_HOST = ENV['ASTERISK_HOST'] || 'localhost'
ASTERISK_PORT = ENV['ASTERISK_PORT'] || '8088'
ASTERISK_ARI_USER = ENV['ASTERISK_ARI_USER'] || 'asterisk'
ASTERISK_ARI_PASSWORD = ENV['ASTERISK_ARI_PASSWORD'] || 'asterisk'

# Rota para verificar status do serviço
get '/api/status' do
  content_type :json
  { status: 'ok', connections: $active_connections.size, calls: $calls.size }.to_json
end

# Rota para obter configurações SIP para o softphone
get '/api/sip_config/:user_id' do |user_id|
  content_type :json
  
  # Aqui você pode carregar configurações específicas do usuário do banco de dados
  # Esta é uma configuração de exemplo
  config = {
    displayName: "Usuário #{user_id}",
    username: "user#{user_id}",
    password: "password123",  # Em produção, não envie senhas em texto simples
    domain: ASTERISK_HOST,
    websocket: "wss://#{ASTERISK_HOST}:#{ASTERISK_PORT}/ws",
    stunServer: "stun:stun.l.google.com:19302",
    autoConnect: true,
    valid: true
  }
  
  config.to_json
end

# Rota para fazer uma chamada
post '/api/call' do
  content_type :json
  request_payload = JSON.parse(request.body.read)
  
  user_id = request_payload['user_id']
  number = request_payload['number']
  
  if !user_id || !number
    status 400
    return { error: 'user_id e number são obrigatórios' }.to_json
  end
  
  # Gerar um ID único para a chamada
  call_id = "call_#{Time.now.to_i}_#{rand(1000)}"
  
  # Registrar a chamada (em produção seria no banco de dados)
  $calls[call_id] = {
    id: call_id,
    user_id: user_id,
    number: number,
    status: 'initiating',
    timestamp: Time.now.to_i
  }
  
  # Aqui você pode iniciar a chamada via API do Asterisk ou outro método
  # Esta é apenas uma simulação
  
  # Retornar ID da chamada para acompanhamento
  { call_id: call_id, status: 'initiating' }.to_json
end

# Rota para finalizar uma chamada
post '/api/hangup/:call_id' do |call_id|
  content_type :json
  
  # Verificar se a chamada existe
  if !$calls[call_id]
    status 404
    return { error: 'Chamada não encontrada' }.to_json
  end
  
  # Atualizar status da chamada
  $calls[call_id][:status] = 'terminated'
  $calls[call_id][:end_time] = Time.now.to_i
  
  # Aqui você pode finalizar a chamada via API do Asterisk
  
  { status: 'success', call: $calls[call_id] }.to_json
end

# Rota para transferir uma chamada
post '/api/transfer' do
  content_type :json
  request_payload = JSON.parse(request.body.read)
  
  call_id = request_payload['call_id']
  target = request_payload['target']
  
  if !call_id || !target
    status 400
    return { error: 'call_id e target são obrigatórios' }.to_json
  end
  
  # Verificar se a chamada existe
  if !$calls[call_id]
    status 404
    return { error: 'Chamada não encontrada' }.to_json
  end
  
  # Atualizar status da chamada
  $calls[call_id][:status] = 'transferring'
  $calls[call_id][:transfer_target] = target
  $calls[call_id][:transfer_time] = Time.now.to_i
  
  # Aqui você pode realizar a transferência via API do Asterisk
  
  { status: 'success', call: $calls[call_id] }.to_json
end

# Webhook para receber callbacks de status de chamada
post '/api/callback/call_status' do
  content_type :json
  request_payload = JSON.parse(request.body.read)
  
  call_id = request_payload['call_id']
  status = request_payload['status']
  
  if !call_id || !status
    status 400
    return { error: 'call_id e status são obrigatórios' }.to_json
  end
  
  # Atualizar status da chamada se ela existir
  if $calls[call_id]
    $calls[call_id][:status] = status
    $calls[call_id][:last_update] = Time.now.to_i
    
    # Aqui você pode acionar eventos ou notificações baseadas no status
    # Por exemplo, enviar notificações em tempo real para sistemas conectados
  end
  
  { status: 'success' }.to_json
end

# Iniciar o servidor
puts "API do Softphone iniciada na porta 4567"
puts "Configure o Asterisk para comunicar com esta API nos webhooks"