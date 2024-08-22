export enum ObjectState {

    TYPE = 'object_state',

    ACTIVE = 'object_state_active',
    INACTIVE = 'object_state_inactive',
    DELETED = 'object_state_deleted',
}


export enum SubscriptionPlanState {

    TYPE = 'subscription_plan_state',

    DRAFT = 'subscription_plan_state_draft',
    ACTIVE = 'subscription_plan_state_active',
    INACTIVE = 'subscription_plan_state_inactive',
    ARCHIVED = 'subscription_plan_state_archived',
    PENDING_APPROVAL = 'subscription_plan_state_pending_approval'
}

export enum SubscriptionStatus {

    TYPE = 'subscription_status',

    ACTIVE = 'subscription_status_active',
    PENDING = 'subscription_status_pending',
    TRIALING = 'subscription_status_trialing',
    SUSPENDED = 'subscription_status_suspended',
    CANCELLED = 'subscription_status_cancelled',
    EXPIRED = 'subscription_status_expired',
    OVERDUE = 'subscription_status_overdue',
    GRACE_PERIOD = 'subscription_status_grace_period',
    INACTIVE = 'subscription_status_inactive',
    PENDING_CANCELLATION = 'subscription_status_pending_cancellation',
    PENDING_RENEWAL = 'subscription_status_pending_renewal',
    TRIAL_ENDED = 'subscription_status_trial_ended',
    ARCHIVED = 'subscription_status_archived',
}
