use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitGroupEntryIx {
    pub group_id: Pubkey,
    pub min_group_seconds: Option<u128>,
}

#[derive(Accounts)]
#[instruction(ix: InitGroupEntryIx)]
pub struct InitGroupEntryCtx<'info> {
    #[account(
        init,
        payer = authority,
        space = GROUP_ENTRY_DEFAULT_SIZE,
        seeds = [GROUP_ENTRY_PREFIX.as_bytes(), ix.group_id.key().as_ref()],
        bump,
    )]
    group_entry: Box<Account<'info, GroupStakeEntry>>,
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitGroupEntryCtx>, ix: InitGroupEntryIx) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let authority = &mut ctx.accounts.authority;
    group_entry.bump = *ctx.bumps.get("group_entry").unwrap();
    group_entry.group_id = ix.group_id;
    group_entry.authority = authority.key();
    group_entry.changed_at = Clock::get().unwrap().unix_timestamp;
    group_entry.min_group_seconds = ix.min_group_seconds;
    Ok(())
}
