SSO_START_URL="https://farmart.awsapps.com/start/#"
PROFILE_NAME="default"
AWS_REGION="ap-south-1"
OUTPUT_FORMAT="json"
SSO_REGION="us-east-1"
SSO_ACCOUNT_ID="722129745903"
SSO_ROLE_NAME="fmt-admin-user"

aws sso login --profile "$PROFILE_NAME" 

# Configure AWS CLI with the provided details
aws configure set sso_start_url "$SSO_START_URL" --profile "$PROFILE_NAME"
aws configure set sso_region "$SSO_REGION" --profile "$PROFILE_NAME"
aws configure set region "$AWS_REGION" --profile "$PROFILE_NAME"
aws configure set output "$OUTPUT_FORMAT" --profile "$PROFILE_NAME"
aws configure set sso_account_id "$SSO_ACCOUNT_ID" --profile "$PROFILE_NAME"
aws configure set sso_role_name "$SSO_ROLE_NAME" --profile "$PROFILE_NAME"

# Run AWS SSO login (this will prompt for authentication)
aws configure sso --profile "$PROFILE_NAME"