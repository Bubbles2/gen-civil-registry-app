SELECT t.code as code, pt_code.svalue as collectionPointCode, pt_lv.svalue as label, pt_lv.svalue as value, row_number() OVER (ORDER BY pt_lv.svalue) as value_order 
FROM digitech.liste l
INNER JOIN digitech.terme t on t.liste_id = l.liste_id
INNER JOIN digitech.param_terme pt_lv on pt_lv.terme_id = t.terme_id
INNER JOIN digitech.type_param_terme tpt_lv on tpt_lv.tpt_id = pt_lv.tpt_id AND tpt_lv.code = 'TERME_DISPLAYED_AND_SAVED_LABEL'
INNER JOIN digitech.param_terme pt_code on pt_code.terme_id = t.terme_id
INNER JOIN digitech.type_param_terme tpt_code on tpt_code.tpt_id = pt_code.tpt_id AND tpt_code.code = 'ADDITIONAL_TERME2'
WHERE l.code = 'LISTE_HOPITAUX'
ORDER BY pt_lv.svalue