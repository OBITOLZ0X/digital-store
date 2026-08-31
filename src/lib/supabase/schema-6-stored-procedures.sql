-- ============================================
-- STORED PROCEDURE: Atomic wallet transaction
-- ============================================
-- This function handles wallet deductions with race-condition protection
-- Must be called with service-role key

CREATE OR REPLACE FUNCTION public.execute_transaction(
  p_user_id UUID,
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_reference TEXT,
  p_description TEXT
) RETURNS void AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the wallet row for update
  SELECT balance INTO v_balance
  FROM public.wallets
  WHERE id = p_wallet_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_new_balance := v_balance - p_amount;

  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Record the transaction
  INSERT INTO public.wallet_transactions (
    id,
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference,
    description,
    status
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_wallet_id,
    p_type,
    p_amount,
    v_balance,
    v_new_balance,
    p_reference,
    p_description,
    'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
