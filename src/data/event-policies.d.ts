export interface EventPolicyItem {
  text: string
  important?: boolean
}

export interface EventPolicySection {
  heading: string
  items: EventPolicyItem[]
}

export interface EventPolicies {
  title: string
  sections: EventPolicySection[]
  footer?: {
    text: string
    important?: boolean
  }
}

declare const eventPolicies: EventPolicies
export default eventPolicies

