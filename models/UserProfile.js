const supabase = require('../config/database');

class UserProfile {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(profileData) {
    const { user_id, full_name, gender, dob, bio, avatar_url } = profileData;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id,
        full_name,
        gender,
        dob,
        bio,
        avatar_url
      })
      .select('user_id')
      .single();
    
    if (error) throw error;
    return data.user_id;
  }

  static async update(userId, profileData) {
    const { full_name, gender, dob, bio, avatar_url, social_links } = profileData;
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name,
        gender,
        dob,
        bio,
        avatar_url,
        social_links
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async verifyPhone(userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ phone_verified: true })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static async verifyEmail(userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}

module.exports = UserProfile;