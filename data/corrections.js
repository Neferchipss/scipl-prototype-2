/* ===========================================================================
   SCIPL — name corrections
   ---------------------------------------------------------------------------
   HAND-MAINTAINED. This is the one content file that is not generated, and it
   exists so that fixing how a client's name reads never means hand-editing a
   generated bundle (which the next `extract_deck.py` would wipe).

   The deck types client names in whatever case the slide happened to use.
   Rendered verbatim they shout — "FIDELITY", "GRASIM" — next to correctly cased
   neighbours, and one of them is not a client name at all: "Knight Frank Office"
   is a building type that collided with the other Knight Frank project.

   ⭐ EVERY ENTRY HERE IS A PRESENTATION CHANGE TO WHAT SCIPL WROTE, and needs
   their sign-off. Anything left out renders exactly as the deck has it.

   Deliberately NOT corrected:
     BOSTIK · NTT DATA · L&T · CPL · MAIRE   — genuinely styled that way
     "Tesla Service Center", "Ultratech Ahura Center" — American spelling, but
       these are the client's own names for their premises. Our copy stays
       en-GB; their facility names stay theirs. On the ask list.
   =========================================================================== */
window.SCIPL_NAMES = {
  'FIDELITY':            'Fidelity',
  'GRASIM':              'Grasim',
  'Knight Frank Office': 'Knight Frank',
};
