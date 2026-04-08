ALTER TABLE "User"
ADD CONSTRAINT "User_balance_non_negative" CHECK ("balance" >= 0);

ALTER TABLE "Service"
ADD CONSTRAINT "Service_price_non_negative" CHECK ("price" >= 0);

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_amount_non_negative" CHECK ("amount" >= 0);
