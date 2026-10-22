# DB01｜r34：ミルク／オイル／電気きのみ候補の出典と保留境界

監査日：2026-10-22。**CURRENTと公開PWAの既存の評価を自動同期する承認ではない**。この文書は公開可能な手続き・出典の監査であり、非公開CURRENT XLSXや未承認の完全 `data.js` はリポジトリに含めない。

## r34で確定修正した二つの状態不整合

1. **ROLE-015 ミルク専任：`need_status`「育成待ち」→「充足」**。IND-0004カメックスはLv30到達、LOG-021/DEC-004が第一完成を記録、ING-008もすでに「充足」。公開r23のRoleSlotも「充足」であり、内部CURRENT r33の残存状態が明確に古かった。 `search_status=停止`、個体評価・優先順位・投入方針はそのまま。ROLE-015のAABカメックスを「種族Tier S」と評価したわけではない。
2. **ING-010 オイル：`role_slot_action`「MODIFY」→「NONE」**。LOG-029(2026-10-03)でオイル／ネギ分割済み、P_RoleSlotsにはROLE-018 `oil_specialist` とROLE-024が存在するため、分割指示の再実行は不要。 `coverage_status=暫定充足`・ROLE-018 `need_status=条件付き充足`は維持。

改訂された非公開正本：`pokemon_sleep_decision_system_CURRENT_r34.xlsx` / `2026-10-22-r34`。旧r33からの**論理セル変更15件**（M_Rules: 3、ROLE-015: 3、ING-010: 3、H_ChangeLog LOG-110追記: 6）。全14シートを照合し、P_Individuals、D_Decisions、M_Species、M_SpeciesAssessment、L_Measurements、S_Scenarios、C_DataPolicy、C_DecisionGateは全セル完全一致。元r33は保管。

## Tierの採否を分ける理由

| RoleSlot | CURRENTに存在する確定事実 | 旧公開r23にあったTier候補 | 今回の判断 |
|---|---|---|---|
| ROLE-015 `milk_specialist` | `upgrade_target_species=blastoise`、担当IND-0004、Lv30ミルクAA、ROLEは充足 | カメックス S、マスカーニャ A | **Tier未評価**。SA-003カメックスSは別の混合供給 `milk_cacao_mixed` 評価なので横流ししない |
| ROLE-018 `oil_specialist` | `upgrade_target_species=ditto`、担当IND-0023、AAオイル、条件付き充足 | ドクロッグS、クチートA+、ウッウA+、メタモンA | **Tier未評価**。SA-020メタモンBは過去のオイル／ネギ**混合** `oil_leek` 評価なので、専任Aに上書きしない |
| ROLE-033 `berry_electric` | `upgrade_target_species=raichu`、IND-0037ピチューで育成待ち／厳選継続 | ライチュウ S | **Tier未評価**。CURRENT履歴のSRP100（1/3）は比較3種の中の評価であり、体系的なS基準を自動証明するものではない |

旧r13に残る[一時的な公開snapshot上書きスクリプト](https://github.com/taka-0223/pokemon-sleep-hub/blob/61ff6a7b1b1711e753e043f69b9f4f470dcf7589/scripts/apply_r13_snapshot.py)はROLE-015/018の上書きの根拠であって、SSOTに反映された正式な種族評価の根拠ではない。ROLE-033は後日の公開r23に見られるが正式な `M_SpeciesAssessment` は未登録。

外部の仕様照合：[カメックス](https://wikiwiki.jp/poke_sleep/カメックス)／[メタモン](https://wikiwiki.jp/poke_sleep/メタモン)／[ライチュウ](https://wikiwiki.jp/poke_sleep/ライチュウ)。種族の基本能力や食材性能の参考とし、独自Tierの代用品にしない。

## 生成器の安全弁（このDraft PR）

`P_RoleSlots.upgrade_target_species` は現在のアカウント上の「候補種」入力として残っている。その一方で、`M_SpeciesAssessment` に当該役割の評価がなく、役割別の候補配列が0件となる場合がある。

- グレード済み候補が0件で**明示的に指定された候補種がある場合だけ**、`targetCandidates` にその種を1件載せる。
- 付与フィールド `grade:null`、`assessmentStatus:"unrated"`。画面は「**Tier未評価**」と表示する。「S」「A+」等は推測しない。
- 既存のTier評価が存在する役割に追加・変更は行わない。候補種そのものが指定されていない役割は未設定のまま。
- 個体評価、収集PR、KEEP/INVEST、RoleSlotの需要状態、育成優先順位・資源を生成コードで勝手に変えない。
- 3役割のケースと通常RoleSlot、SA-003混合供給参照、まったくの未設定役割を合成回帰テストで確認する。

**公開方針**：現行本番はPR #22で復旧済みの「手持ちr33・評価r23参考」を保持。このPRの修復コードはDraftとしてレビューし、公開が必要な場合は別の明示承認で行う。次の正式評価作業は各役割のS/A+/A基準と比較群を収集し、 `M_SpeciesAssessment` に根拠付きで追加する別工程。
