import {createClient} from '@supabase/supabase-js';
export const supabaseUrl='https://iajjgwxnxtvzdwohnqce.supabase.co';
export const publicKey='sb_publishable_BvV1JRVCnscsPf_Fsr6Q3g_g7RChQuT';
export const endpoint=supabaseUrl+'/functions/v1/letstalkmoney';
let client:ReturnType<typeof createClient>|undefined;
export const auth=()=>client??=createClient(supabaseUrl,publicKey,{auth:{storageKey:'letstalkmoney-auth',flowType:'pkce',detectSessionInUrl:true}});
export async function authHeaders(){const {data:{session}}=await auth().auth.getSession();if(!session)throw Error('Sign in to open your private workspace.');return {Authorization:`Bearer ${session.access_token}`,apikey:publicKey};}
export async function signIn(){const token=new URLSearchParams(location.search).get('invite');if(token)sessionStorage.setItem('letstalkmoney-invite',token);const r=await fetch(supabaseUrl+'/auth/v1/settings',{headers:{apikey:publicKey}});const settings:any=await r.json();if(!settings.external?.google)throw Error('Google sign-in is waiting for the owner to enable Google in Supabase Auth.');const {error}=await auth().auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/letstalkmoney/',queryParams:{prompt:'select_account'}}});if(error)throw error;}
export async function signOut(){await auth().auth.signOut();location.assign('/letstalkmoney/');}
