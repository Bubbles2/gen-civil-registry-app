SELECT o.code as office_code, pt_code.svalue as code, pt_lv.svalue as label, 'HEALTH' as type FROM digitech.liste l
INNER JOIN digitech.office o on o.office_id = l.more_filter_id
INNER JOIN digitech.terme t on t.liste_id = l.liste_id
INNER JOIN digitech.param_terme pt_lv on pt_lv.terme_id = t.terme_id
INNER JOIN digitech.type_param_terme tpt_lv on tpt_lv.tpt_id = pt_lv.tpt_id AND tpt_lv.code = 'TERME_DISPLAYED_AND_SAVED_LABEL'
INNER JOIN digitech.param_terme pt_code on pt_code.terme_id = t.terme_id
INNER JOIN digitech.type_param_terme tpt_code on tpt_code.tpt_id = pt_code.tpt_id AND tpt_code.code = 'ADDITIONAL_TERME2'
WHERE l.code = 'LISTE_HOPITAUX'
ORDER BY l.liste_id