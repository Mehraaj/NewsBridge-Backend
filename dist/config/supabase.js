"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Debug logging
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Service Role Key exists:', !!supabaseServiceRoleKey);
console.log('Supabase URL length:', supabaseUrl?.length);
console.log('Service Role Key length:', supabaseServiceRoleKey?.length);
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
    db: {
        schema: 'public, auth'
    },
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    }
});
