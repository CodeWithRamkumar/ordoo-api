const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByPhone(phone) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(userData) {
    const { email, phone_number, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        phone_number,
        password_hash: hashedPassword
      })
      .select('user_id')
      .single();
    
    if (error) throw error;
    return data.user_id;
  }

  static async updateJWT(userId, token, expiresAt) {
    const { error } = await supabase
      .from('users')
      .update({
        jwt_token: token,
        jwt_expires_at: expiresAt
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async validateJWT(userId, token) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .eq('jwt_token', token)
      .gt('jwt_expires_at', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async revokeJWT(userId) {
    const { error } = await supabase
      .from('users')
      .update({
        jwt_token: null,
        jwt_expires_at: null
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async updateOTP(userId, otp, expiresAt) {
    const { error } = await supabase
      .from('users')
      .update({
        otp_code: otp,
        otp_expires_at: expiresAt
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async verifyOTP(userId, otp) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .eq('otp_code', otp)
      .gt('otp_expires_at', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateLastLogin(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async updatePhone(userId, phoneNumber) {
    const { error } = await supabase
      .from('users')
      .update({ phone_number: phoneNumber })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async createSSO(ssoData) {
    const { email, provider, uid } = ssoData;
    
    console.log('Creating SSO user with data:', { email, provider, uid });
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        sso_provider: provider,
        sso_uid: uid,
        password_hash: null // SSO users don't have passwords
      })
      .select('user_id')
      .single();
    
    if (error) {
      console.error('SSO user creation error:', error);
      throw error;
    }
    
    console.log('SSO user created with ID:', data.user_id);
    return data.user_id;
  }
}

module.exports = User;