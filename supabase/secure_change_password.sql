-- Drop the function first if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.secure_change_password(text, text);
DROP FUNCTION IF EXISTS public.secure_change_password(p_username text, p_new_password text);

-- Create secure_change_password function
CREATE OR REPLACE FUNCTION public.secure_change_password(
    p_username text,
    p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner's privilege (bypass typical RLS / schema restrictions)
SET search_path = public
AS $$
DECLARE
    affected_rows int;
BEGIN
    -- Update the password and turn off the is_first_login flag
    UPDATE public.users
    SET password = p_new_password,
        is_first_login = false
    WHERE username = p_username;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Return true if user password was updated, false otherwise
    RETURN affected_rows > 0;
END;
$$;

-- Grant execute permissions to allowed API users
GRANT EXECUTE ON FUNCTION public.secure_change_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.secure_change_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_change_password(text, text) TO service_role;

-- Request PostgREST to reload its schema cache immediately to pick up the new function
NOTIFY pgrst, 'reload schema';
