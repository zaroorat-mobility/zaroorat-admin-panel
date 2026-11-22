import React from 'react'
import {
  PricingSuccessModal,
  type PricingSuccessModalProps,
} from '../../components/PricingSuccessModal'

export type TaxationSuccessModalProps = PricingSuccessModalProps

export const TaxationSuccessModal: React.FC<TaxationSuccessModalProps> = ({
  title = 'Taxation Setup Completed',
  message = 'Your GST, commission and ride tax rules have been saved successfully.',
  primaryButtonText = 'Go to Taxation Overview',
  secondaryButtonText = 'View Configuration',
  ...rest
}) => (
  <PricingSuccessModal
    title={title}
    message={message}
    primaryButtonText={primaryButtonText}
    secondaryButtonText={secondaryButtonText}
    {...rest}
  />
)

export default TaxationSuccessModal
